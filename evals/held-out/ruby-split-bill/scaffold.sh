#!/usr/bin/env bash
# Held-out case: written before tuning and never used to change the skill.
# A small Ruby receipt with line totals in integer cents. The task splits the total
# between people; the test is whether the shares add up exactly to the total.
set -euo pipefail
mkdir -p lib test

cat > lib/receipt.rb <<'EOF'
# A receipt: lines of [name, unit_cents, qty]. Money is always integer cents.
class Receipt
  attr_reader :lines

  def initialize(lines)
    @lines = lines
  end

  # The total in cents.
  def total_cents
    lines.sum { |_name, unit_cents, qty| unit_cents * qty }
  end
end
EOF
cat > test/receipt_test.rb <<'EOF'
require "minitest/autorun"
require_relative "../lib/receipt"

class ReceiptTest < Minitest::Test
  def test_total_sums_the_lines
    receipt = Receipt.new([["Tea", 350, 2], ["Cake", 425, 1]])
    assert_equal 1125, receipt.total_cents
  end
end
EOF
