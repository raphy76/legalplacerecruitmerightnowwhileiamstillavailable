export class Drug {
  constructor(name, expiresIn, benefit) {
    this.name = name;
    this.expiresIn = expiresIn;
    this.benefit = benefit;
  }

  isExpired(){
    return (this.expiresIn <= 0)
  }

  update(){
    switch (this.name) {
      case "Magic Pill":
        return;

      case "Fervex":
        if (this.isExpired()) {
          this.benefit = 0;
        } else {
          let bonus = 1;
          if (this.expiresIn <= 10) bonus = 2;
          if (this.expiresIn <= 5) bonus = 3;
          this.benefit += bonus;
        }
        break;

      case "Herbal Tea":
        this.benefit += this.isExpired() ? 2 : 1;
        break;

      case "Dafalgan":
        // twice as fast as normal
        this.benefit -= this.isExpired() ? 4 : 2;
        break;
        
      default:
        this.benefit -= this.isExpired() ? 2 : 1;
        break;
    }

    // Clamp
    this.benefit = Math.min(50, Math.max(0, this.benefit));

    this.expiresIn--; 
  }

  getExpiresIn(){
    return this.expiresIn;
  }

  getBenefit(){
    return this.benefit;
  }
}

export class Pharmacy {
  constructor(drugs = []) {
    this.drugs = drugs;
  }

  updateBenefitValue() {
    for(let drug of this.drugs){
      drug.update()
    }

    return this.drugs;
  }
}
