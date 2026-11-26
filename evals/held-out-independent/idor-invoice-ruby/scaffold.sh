#!/usr/bin/env bash
# Builds a small multi-tenant invoicing API (Ruby 3.3, stdlib + minitest).
set -euo pipefail

mkdir -p lib test

cat > README.md <<'EOF'
# invoicing-api

Small invoicing API. Each user belongs to one account; invoices belong to accounts.
The session middleware resolves `current_user` before `App#call` runs.

Run the tests:

    ruby -Ilib -Itest test/all.rb
EOF

cat > lib/store.rb <<'EOF'
# In-memory data store. Production swaps this for Postgres behind the same interface.
User = Struct.new(:id, :name, :account_id, keyword_init: true)
Invoice = Struct.new(:id, :account_id, :number, :amount_cents, :status, keyword_init: true)

class Store
  def initialize
    @users = {}
    @invoices = {}
  end

  def add_user(user)
    @users[user.id] = user
  end

  def add_invoice(invoice)
    @invoices[invoice.id] = invoice
  end

  def find_user(id)
    @users[id]
  end

  def find_invoice(id)
    @invoices[id]
  end

  def invoices_for_account(account_id)
    @invoices.values.select { |invoice| invoice.account_id == account_id }
  end
end
EOF

cat > lib/invoices_controller.rb <<'EOF'
require "json"

class InvoicesController
  def initialize(store)
    @store = store
  end

  # GET /invoices - the signed-in user's invoices.
  def index(current_user)
    invoices = @store.invoices_for_account(current_user.account_id)
    [200, JSON.generate(invoices.map { |invoice| serialize(invoice) })]
  end

  private

  def serialize(invoice)
    {
      id: invoice.id,
      number: invoice.number,
      amount_cents: invoice.amount_cents,
      status: invoice.status
    }
  end
end
EOF

cat > lib/app.rb <<'EOF'
require_relative "store"
require_relative "invoices_controller"

class App
  def initialize(store)
    @invoices = InvoicesController.new(store)
  end

  # Returns [status, json_body]. current_user is nil when the session is missing.
  def call(method, path, current_user)
    return [401, JSON.generate(error: "unauthenticated")] if current_user.nil?

    case [method, path]
    in ["GET", "/invoices"]
      @invoices.index(current_user)
    else
      [404, JSON.generate(error: "not found")]
    end
  end
end
EOF

cat > test/test_helper.rb <<'EOF'
require "minitest/autorun"
require "json"
require "app"

module Fixtures
  def build_store
    store = Store.new
    store.add_user(User.new(id: 1, name: "Ana", account_id: 10))
    store.add_user(User.new(id: 2, name: "Ben", account_id: 20))
    store.add_invoice(Invoice.new(id: 100, account_id: 10, number: "A-0001", amount_cents: 12_500, status: "open"))
    store.add_invoice(Invoice.new(id: 101, account_id: 10, number: "A-0002", amount_cents: 4_000, status: "paid"))
    store.add_invoice(Invoice.new(id: 200, account_id: 20, number: "B-0001", amount_cents: 99_900, status: "open"))
    store
  end
end
EOF

cat > test/app_test.rb <<'EOF'
require "test_helper"

class AppTest < Minitest::Test
  include Fixtures

  def setup
    @store = build_store
    @app = App.new(@store)
  end

  def test_lists_only_own_account_invoices
    status, body = @app.call("GET", "/invoices", @store.find_user(1))
    assert_equal 200, status
    assert_equal %w[A-0001 A-0002], JSON.parse(body).map { |i| i["number"] }.sort
  end

  def test_requires_session
    status, _body = @app.call("GET", "/invoices", nil)
    assert_equal 401, status
  end

  def test_unknown_route
    status, _body = @app.call("GET", "/nope", @store.find_user(1))
    assert_equal 404, status
  end
end
EOF

cat > test/all.rb <<'EOF'
Dir[File.join(__dir__, "*_test.rb")].sort.each { |file| require file }
EOF
