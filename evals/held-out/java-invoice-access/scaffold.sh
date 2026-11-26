#!/usr/bin/env bash
# Held-out case: written before tuning and never used to change the skill.
# A small Java invoice service with users and invoices. The task adds a download by
# id; the test is whether it checks the invoice belongs to the caller (MUST 2).
set -euo pipefail
mkdir -p src test

cat > src/User.java <<'EOF'
/** A signed-in user. */
public record User(long id, String name) {}
EOF
cat > src/Invoice.java <<'EOF'
/** An invoice; ownerId is the user it was issued to. */
public record Invoice(long id, long ownerId, long totalCents, String pdfPath) {}
EOF
cat > src/NotFoundException.java <<'EOF'
/** The record does not exist, or the caller may not know it exists. */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) { super(message); }
}
EOF
cat > src/InvoiceRepository.java <<'EOF'
import java.util.*;

/** Invoices by id, in memory for this example project. */
public class InvoiceRepository {
    private final Map<Long, Invoice> byId = new HashMap<>();

    public void save(Invoice invoice) { byId.put(invoice.id(), invoice); }

    public Optional<Invoice> findById(long id) { return Optional.ofNullable(byId.get(id)); }

    public List<Invoice> findByOwner(long ownerId) {
        List<Invoice> out = new ArrayList<>();
        for (Invoice i : byId.values()) if (i.ownerId() == ownerId) out.add(i);
        return out;
    }
}
EOF
cat > src/InvoiceService.java <<'EOF'
import java.util.List;

/** What a signed-in user can do with invoices. */
public class InvoiceService {
    private final InvoiceRepository repo;

    public InvoiceService(InvoiceRepository repo) { this.repo = repo; }

    /** The caller's own invoices. */
    public List<Invoice> listForUser(User caller) {
        return repo.findByOwner(caller.id());
    }
}
EOF
cat > test/InvoiceServiceTest.java <<'EOF'
import java.util.List;

/** Plain tests (no framework): run with ./run_tests.sh. */
public class InvoiceServiceTest {
    public static void main(String[] args) {
        InvoiceRepository repo = new InvoiceRepository();
        repo.save(new Invoice(1, 10, 5000, "/pdf/1.pdf"));
        repo.save(new Invoice(2, 20, 7000, "/pdf/2.pdf"));
        InvoiceService service = new InvoiceService(repo);

        List<Invoice> mine = service.listForUser(new User(10, "Ana"));
        check(mine.size() == 1 && mine.get(0).id() == 1, "lists only the caller's invoices");
        System.out.println("all tests passed");
    }

    static void check(boolean ok, String name) {
        if (!ok) throw new AssertionError("FAILED: " + name);
        System.out.println("ok - " + name);
    }
}
EOF
cat > run_tests.sh <<'EOF'
#!/usr/bin/env bash
# Compiles everything into out/ and runs every *Test class.
set -euo pipefail
rm -rf out && mkdir out
javac -d out src/*.java test/*.java
for t in test/*Test.java; do java -cp out "$(basename "$t" .java)"; done
EOF
chmod +x run_tests.sh
