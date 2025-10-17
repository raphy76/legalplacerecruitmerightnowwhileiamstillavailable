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
    if(this.name == "Magic Pill") return;

    if(this.name == "Fervex") {

      if(this.isExpired()){
        this.benefit = 0;
      } else {
        let bonus = 1;
        if(this.expiresIn <= 10) bonus = 2;
        if(this.expiresIn <= 5) bonus = 3;

        this.benefit += bonus;
      }

    } else {

      let bonus = -1;
      if(this.name == "Herbal Tea") bonus = 1;
      if(this.isExpired()) bonus *= 2;

      this.benefit += bonus;

    }

    // clamp
    if(this.benefit < 0) this.benefit = 0;
    if(this.benefit > 50) this.benefit = 50; 

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
