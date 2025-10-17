// Funny solution based on multiple inheritance allowing to dynamically add methods to Drug
// Each instance of Drug can only access relevant methods

// Important notes :
//
// Note 1 :
// It's important to add the class name between "class" and "extends Base" when declaring a mixin
// For example, in the following :
// const Bonus = (Base) => class Bonus extends Base {...
// It's important to add "Bonus" between "class" and "extends Base"
// Otherwise, it breaks the getMethodsOf function
// 
// Note 2 :
// The different kinds of drug must only implement methods and no constructor (or if you need to, you'll need to change the architecture used to dynamically add methods to drug)

//// Utility to handle multiple inheritance in JS
function mix(...mixins) {
  let Base = class {};
  
  const appliedMixins = [];
  for (const Mixin of mixins) {
    Base = Mixin(Base);
    appliedMixins.push(Mixin);
  }

  Base.__mixins__ = appliedMixins;

  return Base;
}

// Get all methods of a class (including its base class(es))
// The base class(e) can either come from the standard : "class A extends B {}" or can com from mixin : "class A extends mix(B,C,D)"
function getMethodsOf(classOrMixin, base = class {}) {
  const methods = [];

  if (!classOrMixin) return methods;

  let currentClass;

  if (typeof classOrMixin === "function" && classOrMixin.prototype === undefined) {
    currentClass = classOrMixin(base);
  } else {
    currentClass = classOrMixin;
  }

  // Identify direct methods
  const ownMethods = Object.getOwnPropertyNames(currentClass.prototype)
    .filter(name => name !== "constructor" && typeof currentClass.prototype[name] === "function");

  for (const name of ownMethods) {
    methods.push({ methodName: name, classRef: currentClass });
  }


  // If inherit from a ParentClass via usual "extends ParentClass", identify the ParentClass and get the methods of the ParentClass
  const parentClass = Object.getPrototypeOf(currentClass.prototype)?.constructor;
  if (parentClass && parentClass !== Object) {
    methods.push(...getMethodsOf(parentClass));
  }


  // if inherit from multiple classes via mixin "extends mix(classA, classB, classC, ...)", identify the classes and get their methods
  if (currentClass.__mixins__ && currentClass.__mixins__.length > 0) {
    for (const mixinClass of currentClass.__mixins__) {
      methods.push(...getMethodsOf(mixinClass));
    }
  }


  // Delete doublon
  const unique = [];
  const seen = new Set();
  for (const m of methods) {
    const key = `${m.classRef.name}.${m.methodName}`;
    if (!seen.has(key)) {
      unique.push(m);
      seen.add(key);
    }
  }

  return unique;
}


//// Reusable set of methods to build different kinds of drug
const Bonus = (Base) => class Bonus extends Base {
  // Set of methods related to Drug that increase benefit over time

  increaseBenefit(amount) {
    this.benefit = Math.min(Drug.MAX_BENEFIT, this.benefit + amount)
  }
}

const Malus = (Base) => class Malus extends Base {
  // Set of methods related to Drug that decrease benefit over time

  decreaseBenefit(amount) {
    this.benefit = Math.max(Drug.MIN_BENEFIT, this.benefit - amount)
  }   
}

const Expirable = (Base) => class Expirable extends Base {
  // Set of methods related to Drug that can expire

  isExpired(){
    return (this.expiresIn <= 0)
  } 

  decreaseExpiration(){
    this.expiresIn--;
  }

  update(){
    this.updateBenefit();
    this.decreaseExpiration();
  }
}


//// Different kinds of drug
class NormalDrug extends mix(Malus, Expirable) {
  static MALUS = 1;
  static EXPIRED_MALUS = 2 * NormalDrug.MALUS;

  updateBenefit(){
    this.decreaseBenefit(this.isExpired() ? NormalDrug.EXPIRED_MALUS : NormalDrug.MALUS);
  }
}

class HerbalTea extends mix(Bonus, Expirable) {
  static BONUS = 1;
  static EXPIRED_BONUS = 2 * HerbalTea.BONUS;

  updateBenefit() {
    this.increaseBenefit(this.isExpired() ? HerbalTea.EXPIRED_BONUS : HerbalTea.BONUS);
  }
}

class MagicPill {
  update(){
    // Magic Pill does not change benefit or expiration
  }
}

class Fervex extends mix(Bonus, Expirable) {
  static BONUS = 1;
  static BONUS_10_DAYS = 2;
  static BONUS_5_DAYS = 3;
  static EXPIRED_BENEFIT = 0;
  static d_10_DAYS = 10;
  static d_5_DAYS = 5;

  updateBenefit() {
    if(this.isExpired()){
      this.benefit = Fervex.EXPIRED_BENEFIT
    } else {
      let computedBonus = Fervex.BONUS;
      if (this.expiresIn <= Fervex.d_10_DAYS) computedBonus = Fervex.BONUS_10_DAYS;
      if (this.expiresIn <= Fervex.d_5_DAYS) computedBonus = Fervex.BONUS_5_DAYS;
      
      this.increaseBenefit(computedBonus);       
    }
  }
}

class Dafalgan extends mix(Malus, Expirable) {
  updateBenefit() {
    let malus = 2 * NormalDrug.MALUS; // twice as fast as normal drug
    let expired_malus = 2 * malus;
    this.decreaseBenefit(this.isExpired() ? expired_malus : malus);
  }
}



////
export class Drug {
  static MAX_BENEFIT = 50;
  static MIN_BENEFIT = 0;

  static BehaviorMap = {
    "Normal Drug": {methodsToAdd : getMethodsOf(NormalDrug)},
    "Herbal Tea": {methodsToAdd : getMethodsOf(HerbalTea)},
    "Fervex": {methodsToAdd : getMethodsOf(Fervex)},
    "Magic Pill": {methodsToAdd : getMethodsOf(MagicPill)},
    "Dafalgan": {methodsToAdd : getMethodsOf(Dafalgan)},
  };
  static defaultMethodsToAdd = {methodsToAdd:getMethodsOf(NormalDrug)}

 // Cache to avoid recreating same prototypes 5 times
  static __behaviorProtoCache = new Map();

  constructor(name, expiresIn, benefit) {
    this.name = name;
    this.expiresIn = expiresIn;
    this.benefit = benefit;

    // Dynamically attach methods according to name
    this.addMethods(name)
  }

  addMethods(name){
   const behaviorKey = Drug.BehaviorMap[name] ? name : "__default__";

    if (!Drug.__behaviorProtoCache.has(behaviorKey)) {
      const methodsToAdd =
        Drug.BehaviorMap[name]?.methodsToAdd ||
        Drug.defaultMethodsToAdd.methodsToAdd;

      // Create proto derivated from Drug.prototype
      const behaviorProto = Object.create(Drug.prototype);

      for (let { methodName, classRef } of methodsToAdd) {
        behaviorProto[methodName] = classRef.prototype[methodName];
      }

      Drug.__behaviorProtoCache.set(behaviorKey, behaviorProto);
    }

    // Each instance gets the corresponding prototype
    Object.setPrototypeOf(this, Drug.__behaviorProtoCache.get(behaviorKey));
  }

  getExpiresIn(){
    return this.expiresIn;
  }

  getBenefit(){
    return this.benefit;
  }

  // Necesary to correctly generate output.json via JSON.stringify and JSON.parse if private attributes
  toJSON() {
    return {
      name: this.name,
      expiresIn: this.expiresIn,
      benefit: this.benefit,
    };
  }
}


////
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
