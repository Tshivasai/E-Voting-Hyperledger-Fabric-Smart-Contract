'use strict';

class Election {

  async validateElection(electionId) {

    if (electionId) {
      return true;
    } else {
      return false;
    }
  }
  constructor(name, year, startDate, endDate) {
    
    this.electionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    if (this.validateElection(this.electionId)) {
      this.name = name;
      this.year = year;
      this.partyIds = [];
      this.startDate = startDate;
      this.endDate = endDate;
      this.type = 'election';
      if (this.__isContract) {
        delete this.__isContract;
      }
      return this;
    } else {
      throw new Error('not a valid election!');
    }
  }
}
module.exports = Election;