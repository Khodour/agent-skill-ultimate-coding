/** Safe versions of the patterns check-diff looks for. */
export async function loadOrders(db: Db, ids: number[]) {
  // One query for all ids, not one per id.
  return db.query("SELECT * FROM orders WHERE id = ANY($1)", [ids]);
}

export function render(el: HTMLElement, comment: Comment) {
  el.textContent = comment.body;
}

export function totalCents(lines: Line[]): number {
  let total = 0;
  for (const line of lines) {
    total += line.priceCents * line.qty;
  }
  return total;
}

export async function notify(user: User) {
  try {
    await sendEmail(user);
  } catch (err) {
    logger.error("email failed", { userId: user.id, err });
    throw err;
  }
}

const token = process.env.API_TOKEN;
const items = list.find((x) => x.id === id);
