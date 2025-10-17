// Compact solution

export class Drug {
  static MAX_BENEFIT = 50;
  static MIN_BENEFIT = 0;

  static NORMAL_MALUS = 1;
  static EXPIRED_NORMAL_MALUS = 2 * Drug.NORMAL_MALUS;

  static HERBAL_BONUS = 1;
  static EXPIRED_HERBAL_BONUS = 2 * Drug.HERBAL_BONUS;

  static EXPIRED_FERVEX_BENEFIT = 0;
  static FERVEX_BONUS = 1;
  static FERVEX_BONUS_5_DAYS = 3;
  static FERVEX_BONUS_10_DAYS = 2;

  static DAFALGAN_MALUS = 2 * Drug.NORMAL_MALUS;
  static EXPIRED_DAFALGAN_MALUS = 2 * Drug.DAFALGAN_MALUS;

  constructor(name, expiresIn, benefit) {
    this.name = name;
    this.expiresIn = expiresIn;
    this.benefit = benefit;

    this.updatefunc = this.#resolveUpdateFunc(name);
  }

  update() {
    this.updatefunc();
  }

  #resolveUpdateFunc(name){
    let updatefunc;

    switch (name) {
      case "Herbal Tea": updatefunc = this.#updateHerbalTea; break;
      case "Magic Pill": updatefunc = this.#updateMagicPill; break;
      case "Fervex": updatefunc = this.#updateFervex; break;
      case "Dafalgan": updatefunc = this.#updateDafalgan; break;
      
      default: updatefunc = this.#updateNormalDrug;
    }  

    return updatefunc;
  }

  getExpiresIn(){
    return this.expiresIn;
  }

  getBenefit(){
    return this.benefit;
  }

  //// Update for normal drug
  #updateNormalDrug() {
    const malus = this.#isExpired() ? Drug.EXPIRED_NORMAL_MALUS : Drug.NORMAL_MALUS
    this.#setBenefit(this.benefit - malus);

    this.expiresIn--;
  }


  //// Update for special drugs
  #updateHerbalTea() {
    const bonus = this.#isExpired() ? Drug.EXPIRED_HERBAL_BONUS : Drug.HERBAL_BONUS
    this.#setBenefit(this.benefit + bonus);

    this.expiresIn--;
  }

  #updateMagicPill(){
    // No change
  }

  #updateFervex() {
    if(this.#isExpired()){
      this.benefit = Drug.EXPIRED_FERVEX_BENEFIT;
    } else {
      let bonus = Drug.FERVEX_BONUS
      if(this.expiresIn <= 10) bonus = Drug.FERVEX_BONUS_10_DAYS;
      if(this.expiresIn <= 5) bonus = Drug.FERVEX_BONUS_5_DAYS;
      
      this.#setBenefit(this.benefit + bonus);
    }

    this.expiresIn--;
  }

  #updateDafalgan() {
    const malus = this.#isExpired() ? Drug.EXPIRED_DAFALGAN_MALUS : Drug.DAFALGAN_MALUS
    this.#setBenefit(this.benefit - malus);

    this.expiresIn--;
  }


  //// Utility methods
  #isExpired(){
    return (this.expiresIn <= 0);
  }

  #setBenefit(v){
    this.benefit = Math.min(Drug.MAX_BENEFIT, Math.max(Drug.MIN_BENEFIT, v));
  }
}

export class Pharmacy {

  constructor(drugs = []) {
    this.drugs = drugs;
  }

  updateBenefitValue() {
    for (const drug of this.drugs) {
      drug.update()
    }

    return this.drugs;
  }
}
