'use strict';

class Party {

  async validateParty(partyId) {
    if (partyId) {
      return true;
    } else {
      return false;
    }
  }

  constructor(id, name, des) {
    this.partyId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    if (this.validateParty(this.partyId)) {
      this.electionId = id;
      this.name = name;
      this.des = des;
      this.count = 0;
      this.type = 'party';
      if (this.__isContract) {
        delete this.__isContract;
      }
      return this;
  }
}
}
module.exports = Party;