// Funny c++-style over-engineered solution with private attributes, friend system and composition


//// Reusable class utils to build different kinds of drug
class Bonus {
  increaseBenefit(drug, amount) {
    drug._friend_().setBenefit(
      Math.min(
        Drug.MAX_BENEFIT, 
        drug._friend_().getBenefit() + amount
      )
    )
  }
}

class Malus {
  decreaseBenefit(drug, amount) {
    drug._friend_().setBenefit(
      Math.max(
        Drug.MIN_BENEFIT, 
        drug._friend_().getBenefit() - amount
      )
    )
  }   
}

class Expirable {
  isExpired(drug){
    return (drug._friend_().getExpiresIn() <= 0)
  } 

  decreaseExpiration(drug){
    drug._friend_().setExpireIn(drug._friend_().getExpiresIn() - 1)
  }
}


//// Different kinds of drug
class NormalDrug {
  static MALUS = 1;
  static EXPIRED_MALUS = 2 * NormalDrug.MALUS;

  #malus = new Malus();
  #expirable = new Expirable();

  update(drug){
    this.#malus.decreaseBenefit(
      drug, 
      this.#expirable.isExpired(drug) ? NormalDrug.EXPIRED_MALUS : NormalDrug.MALUS
    );

    this.#expirable.decreaseExpiration(drug)   
  }
}

class HerbalTea {
  static BONUS = 1;
  static EXPIRED_BONUS = 2 * HerbalTea.BONUS;

  #bonus = new Bonus();
  #expirable = new Expirable();

  update(drug) {
    this.#bonus.increaseBenefit(
      drug, 
      this.#expirable.isExpired(drug) ? HerbalTea.EXPIRED_BONUS : HerbalTea.BONUS
    );

    this.#expirable.decreaseExpiration(drug)
  }
}

class MagicPill {
  update(drug){
    // Magic Pill does not change benefit or expiration
  }
}

class Fervex {
  static BONUS = 1;
  static BONUS_10_DAYS = 2;
  static BONUS_5_DAYS = 3;
  static EXPIRED_BENEFIT = 0;
  static d_10_DAYS = 10;
  static d_5_DAYS = 5;

  #bonus = new Bonus();
  #expirable = new Expirable();

  update(drug) {
    if(this.#expirable.isExpired(drug)){
      drug._friend_().setBenefit(Fervex.EXPIRED_BENEFIT);
    } else {
      let computedBonus = Fervex.BONUS;
      if (drug._friend_().getExpiresIn() <= Fervex.d_10_DAYS) computedBonus = Fervex.BONUS_10_DAYS;
      if (drug._friend_().getExpiresIn() <= Fervex.d_5_DAYS) computedBonus = Fervex.BONUS_5_DAYS;
      
      this.#bonus.increaseBenefit(drug, computedBonus);       
    }

    this.#expirable.decreaseExpiration(drug)
  }
}

class Dafalgan {
  #malus = new Malus();
  #expirable = new Expirable();

  #daf_malus;
  #expired_daf_malus;
  constructor(normalDrugMalus){
    this.#daf_malus = 2 * normalDrugMalus;
    this.#expired_daf_malus = 2 * this.#daf_malus;
  }

  update(drug) {
    this.#malus.decreaseBenefit(
      drug, 
      this.#expirable.isExpired(drug) ? this.#expired_daf_malus : this.#daf_malus
    );

    this.#expirable.decreaseExpiration(drug)
  }
}


////
export class Drug {
  static MAX_BENEFIT = 50;
  static MIN_BENEFIT = 0;

  static DrugFactoryMap = {
    "Herbal Tea": () => new HerbalTea(),
    "Fervex": () => new Fervex(),
    "Magic Pill": () =>  new MagicPill() ,
    "Dafalgan": () => new Dafalgan(NormalDrug.MALUS),
  }

  #name;
  #expiresIn;
  #benefit;
  #methods; // custom set of methods according to #name
  constructor(name, expiresIn, benefit) {
    this.#name = name;
    this.#expiresIn = expiresIn;
    this.#benefit = benefit;

    this.#methods = (Drug.DrugFactoryMap[this.#name] || (() => new NormalDrug()))();
  }

  ////
  // Ugly but JS doesn't implement friend class system like C++ so we fake it
  // Instead, we could have let expiresIn and benefit public and name them respectively _expiresIn and _benefit
  // But it's funnier to do as below :
  //
  // Control access for friend classes : Expirable, Malus, Fervex and Bonus
  _friend_(){
    return {
      setExpireIn: (v) => {this.#expiresIn = v;},
      getExpiresIn : () => {return this.#expiresIn;},

      setBenefit : (v) => {this.#benefit = v;},
      getBenefit : () => {return this.#benefit;}
    };
  }
  ////

  getExpiresIn(){
    return this.#expiresIn;
  }

  getBenefit(){
    return this.#benefit;
  }

  update() {
    this.#methods.update(this);
  }

  // Necesary to correctly generate output.json via JSON.stringify and JSON.parse
  toJSON() {
    return {
      name: this.#name,
      expiresIn: this.#expiresIn,
      benefit: this.#benefit,
    };
  }
}


////
export class Pharmacy {

  #drugs;
  constructor(drugs = []) {
    this.#drugs = drugs;
  }

  updateBenefitValue() {
    for (const drug of this.#drugs) {
      drug.update()
    }

    return this.#drugs;
  }
}
