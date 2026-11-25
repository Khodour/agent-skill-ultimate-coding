it.skip("rejects an expired coupon", () => {
  expect(apply(expired)).toThrow();
});
