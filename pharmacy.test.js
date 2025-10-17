import { Drug, Pharmacy } from "./pharmacy";

// ################ 
// ######## Solve spec ambiguities and interpretations ######## 
// We can see some ambiguity in the spec.
// Personally, I was not sure whether "expiresIn" could be negative, but from the initial algo and output.json, it looks like it is ok.
// Also, should we consider a drug "expired" when expiresIn <= 0, or only when expiresIn < 0?

// ChatGPT suggests more possible ambiguities :

  /*  
  Excellent question — yes ✅, there is some ambiguity in that specification.
  It’s a great exercise because this kind of spec is intentionally written like a real-world product brief — clear enough, but not perfectly precise.

  Let’s go through the main ambiguities and edge cases 👇
  -----------------------
  ⚖️ 2️⃣ “Once the expiration date has passed, Benefit degrades twice as fast.”

  Ambiguity:
  Is “expiration date” considered when expiresIn === 0, or when it becomes negative?
  The phrase “has passed” could mean “after 0”, i.e., when expiresIn < 0.

  ✅ Common interpretation:
  When expiresIn <= 0, we apply the “twice as fast” rule.
  -----------------------
  ⚖️ 3️⃣ Herbal Tea — “Benefit increases twice as fast after the expiration date.”

  Ambiguity:
  Does the expiresIn still decrease? (yes, but not explicitly stated)
  What happens if benefit is already 50 before applying “twice as fast”?
  → The rule says never more than 50, so you must clamp the value.

  ✅ Interpretation:

  expiresIn decreases daily.
  Benefit increases by 1 per day normally, +2 per day after expiration, capped at 50.
  -----------------------
  ⚖️ 4️⃣ Fervex — “Benefit increases by 2 when there are 10 days or less and by 3 when there are 5 days or less”

  Ambiguities:
  Are the thresholds inclusive? (<= 10, <= 5 ?)
  If it’s exactly 10 or 5 days, which rule applies?

  ✅ Interpretation (industry standard):

  <= 10 → +2
  <= 5 → +3
  After expiration (<= 0) → 0
  -----------------------
  ⚖️ 5️⃣ Dafalgan — “degrades in Benefit twice as fast as normal drugs”

  Ambiguities:
  Does that mean twice as fast before and after expiration?
  Or just before expiration?

  ✅ Likely interpretation (consistent with other rules):

  Yes, it degrades twice as fast in all cases.
  Normal drug: -1 per day, -2 after expiration
  Dafalgan: -2 per day, -4 after expiration
  -----------------------
  ⚖️ 6️⃣ General “Benefit of an item is never negative / more than 50”

  Ambiguity:
  Should we enforce the rule after each operation, or only when displaying values?

  ✅ Interpretation:
  Clamp after each update step:
  benefit = Math.max(0, Math.min(benefit, 50));
  -----------------------
  ⚖️ 7️⃣ What about new or unknown drugs?

  The spec doesn’t say what happens if a drug has a name that’s not in the known list (“Herbal Tea”, “Magic Pill”, “Fervex”, “Dafalgan”).

  ✅ Assume:
  Unknown drugs behave like normal ones (degrade by -1, -2 after expiration).
  -----------------------
  ✅ Summary Table
  Drug type expiresIn change  benefit change  after expiration
  Normal  -1  -1  -2
  Herbal Tea  -1  +1  +2
  Fervex  -1  +1 / +2 / +3 depending on days  drops to 0
  Magic Pill  0 0 0
  Dafalgan  -1  -2  -4

  Would you like me to show you a fully disambiguated version of the rules rewritten as exact pseudocode or TypeScript logic (so there’s zero room for doubt)?
  */
// ################ 

describe("Different kinds of drug", () => {

  describe("Normal Drug", () => {

    it.each([
      [2, 3,  1, 2],
      [1, 20, 0, 19],
      [1, 15, 0, 14],
      [1, 1,  0, 0],
      [5, 10, 4, 9],
      [1, 20, 0, 19],
    ])(
      "should decrease benefit and expiresIn (expiresIn=%i, benefit=%i)",
      (expiresIn, benefit, expectedExpiresIn, expectedBenefit) => {
        const drug = new Drug("test drug", expiresIn, benefit);
        drug.update();

        expect(drug.getExpiresIn()).toBe(expectedExpiresIn);
        expect(drug.getBenefit()).toBe(expectedBenefit);
      }
    );

    it.each([
      [0, 20, -1, 18],
      [-7, 15, -8, 13],
      [-3, 10, -4, 8],
    ])(
      "should degrade benefit twice as fast after expiration (expiresIn=%i, benefit=%i)",
      (expiresIn, benefit, expectedExpiresIn, expectedBenefit) => {
        const drug = new Drug("test drug", expiresIn, benefit);
        drug.update();

        expect(drug.getExpiresIn()).toBe(expectedExpiresIn);
        expect(drug.getBenefit()).toBe(expectedBenefit);
      }
    );

    it.each([
      [5, 0, 4, 0],
      [-7, 1, -8, 0],
      [0, 1, -1, 0],
      [7, 0, 6, 0],
    ])(
      "should not make benefit negative (expiresIn=%i, benefit=%i)",
      (expiresIn, benefit, expectedExpiresIn, expectedBenefit) => {
        const drug = new Drug("test drug", expiresIn, benefit);
        drug.update()

        expect(drug.getExpiresIn()).toBe(expectedExpiresIn);
        expect(drug.getBenefit()).toBe(expectedBenefit);
      }
    );

  });

  describe("Herbal Tea", () => {

    it("should increase benefit normally", () => {
      const drug = new Drug("Herbal Tea", 10, 10);
      drug.update();

      expect(drug.getExpiresIn()).toBe(9);
      expect(drug.getBenefit()).toBe(11);
    });

    it("should increase benefit twice as fast after expiration", () => {
      const drug = new Drug("Herbal Tea", 0, 10);
      drug.update();

      expect(drug.getBenefit()).toBe(12);
    });

    it("should not increase benefit over 50", () => {
      const drug = new Drug("Herbal Tea", 5, 50);
      drug.update();

      expect(drug.getBenefit()).toBe(50);
    });

  });

  describe("Magic Pill", () => {

    it("should never change benefit or expiresIn", () => {
      const drug = new Drug("Magic Pill", 5, 40);
      drug.update();

      expect(drug.getExpiresIn()).toBe(5);
      expect(drug.getBenefit()).toBe(40);
    });

  });

  describe("Fervex", () => {

    it("should increase benefit by 1 normally", () => {
      const drug = new Drug("Fervex", 15, 20);
      drug.update();

      expect(drug.getExpiresIn()).toBe(14);
      expect(drug.getBenefit()).toBe(21);
    });

    it("should increase benefit by 2 when 10 days or less", () => {
      const drug = new Drug("Fervex", 10, 20);
      drug.update();

      expect(drug.getExpiresIn()).toBe(9);
      expect(drug.getBenefit()).toBe(22);
    });

    it("should increase benefit by 3 when 5 days or less", () => {
      const drug = new Drug("Fervex", 5, 20);
      drug.update();

      expect(drug.getBenefit()).toBe(23);
    });

    it("should drop benefit to 0 after expiration", () => {
      const drug = new Drug("Fervex", 0, 20);
      drug.update();

      expect(drug.getBenefit()).toBe(0);
    });

  });

  describe("Dafalgan", () => {

    it("should degrade twice as fast as normal drugs", () => {
      const drug = new Drug("Dafalgan", 10, 20);
      drug.update();

      expect(drug.getBenefit()).toBe(18);
    });

    it("should degrade twice as fast after expiration", () => {
      const drug = new Drug("Dafalgan", 0, 10);
      drug.update();

      expect(drug.getBenefit()).toBe(6);
    });

  });
});

describe("Pharmacy", () => {

  it("should decrease the benefit and expiresIn", () => {
    expect(new Pharmacy([new Drug("test", 2, 3)]).updateBenefitValue()).toEqual(
      [new Drug("test", 1, 2)],
    );
  });

  it("should update each drug of the pharmacy", () => {
    const pharmacy = new Pharmacy(
      [
        new Drug("Test drug", 10, 17), 
        new Drug("Test drug", 10, 20), 
        new Drug("Test drug", 10, 20),
        new Drug("Test drug", -2, 20),
      ]
    );

    const [drug0,drug1,drug2,drug3] = pharmacy.updateBenefitValue();

    expect(drug0.getBenefit()).toBe(16);
    expect(drug1.getBenefit()).toBe(19);
    expect(drug2.getBenefit()).toBe(19);
    expect(drug3.getBenefit()).toBe(18);
  });

  it("should update each drug of the pharmacy", () => {
    const pharmacy = new Pharmacy(
      [
        new Drug("Dafalgan", 10, 20), 
        new Drug("Dafalgan", 10, 20), 
        new Drug("Dafalgan", 10, 20),
        new Drug("Test drug", 10, 20),
      ]
    );

    const [drug0,drug1,drug2,drug3] = pharmacy.updateBenefitValue();

    expect(drug0.getBenefit()).toBe(18);
    expect(drug1.getBenefit()).toBe(18);
    expect(drug2.getBenefit()).toBe(18);
    expect(drug3.getBenefit()).toBe(19);
  });
});
