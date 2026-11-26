#!/usr/bin/env bash
# Builds a small restaurant billing library (Java 17, no build tool, plain-main tests).
set -euo pipefail

mkdir -p src/billing test/billing

cat > run-tests.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
rm -rf out
javac -d out src/billing/*.java test/billing/*.java
for t in test/billing/*Test.java; do
  name="$(basename "$t" .java)"
  java -ea -cp out "billing.$name"
done
EOF
chmod +x run-tests.sh

cat > src/billing/Money.java <<'EOF'
package billing;

import java.util.Objects;

/** An amount of money in euro cents. Immutable. */
public final class Money implements Comparable<Money> {
    public static final Money ZERO = new Money(0);

    private final long cents;

    private Money(long cents) {
        this.cents = cents;
    }

    public static Money ofCents(long cents) {
        return new Money(cents);
    }

    /** Parses "12.34", "12.3" or "12" into cents. */
    public static Money parse(String amount) {
        String[] parts = amount.trim().split("\\.", -1);
        if (parts.length > 2) {
            throw new IllegalArgumentException("Bad amount: " + amount);
        }
        long whole = Long.parseLong(parts[0]);
        String fraction = parts.length == 2 ? parts[1] : "";
        if (fraction.length() > 2) {
            throw new IllegalArgumentException("More than two decimals: " + amount);
        }
        while (fraction.length() < 2) {
            fraction = fraction + "0";
        }
        return new Money(Math.addExact(Math.multiplyExact(whole, 100L), Long.parseLong(fraction)));
    }

    public long cents() {
        return cents;
    }

    public Money plus(Money other) {
        return new Money(Math.addExact(cents, other.cents));
    }

    public Money times(int quantity) {
        return new Money(Math.multiplyExact(cents, (long) quantity));
    }

    public boolean isNegative() {
        return cents < 0;
    }

    @Override
    public int compareTo(Money other) {
        return Long.compare(cents, other.cents);
    }

    @Override
    public boolean equals(Object o) {
        return o instanceof Money m && m.cents == cents;
    }

    @Override
    public int hashCode() {
        return Objects.hash(cents);
    }

    @Override
    public String toString() {
        String digits = Long.toString(Math.abs(cents));
        while (digits.length() < 3) {
            digits = "0" + digits;
        }
        int point = digits.length() - 2;
        return (cents < 0 ? "-" : "") + digits.substring(0, point) + "." + digits.substring(point) + " EUR";
    }
}
EOF

cat > src/billing/LineItem.java <<'EOF'
package billing;

public record LineItem(String description, Money unitPrice, int quantity) {
    public LineItem {
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive");
        }
    }

    public Money amount() {
        return unitPrice.times(quantity);
    }
}
EOF

cat > src/billing/Bill.java <<'EOF'
package billing;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** A table's bill. */
public final class Bill {
    private final List<LineItem> items = new ArrayList<>();

    public Bill add(LineItem item) {
        items.add(item);
        return this;
    }

    public List<LineItem> items() {
        return Collections.unmodifiableList(items);
    }

    public Money total() {
        Money total = Money.ZERO;
        for (LineItem item : items) {
            total = total.plus(item.amount());
        }
        return total;
    }
}
EOF

cat > test/billing/BillTest.java <<'EOF'
package billing;

public final class BillTest {
    private static int failures = 0;

    private static void check(String name, Object expected, Object actual) {
        if (!expected.equals(actual)) {
            failures++;
            System.out.println("FAIL " + name + ": expected " + expected + " but was " + actual);
        } else {
            System.out.println("ok   " + name);
        }
    }

    public static void main(String[] args) {
        check("parse whole", Money.ofCents(1200), Money.parse("12"));
        check("parse one decimal", Money.ofCents(1230), Money.parse("12.3"));
        check("toString", "0.05 EUR", Money.ofCents(5).toString());

        Bill bill = new Bill()
                .add(new LineItem("Pasta", Money.parse("14.50"), 2))
                .add(new LineItem("Water", Money.parse("3.20"), 3));
        check("total", Money.parse("38.60"), bill.total());
        check("empty total", Money.ZERO, new Bill().total());

        if (failures > 0) {
            System.out.println(failures + " test(s) failed");
            System.exit(1);
        }
        System.out.println("all tests passed");
    }
}
EOF
