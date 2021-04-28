'use strict';

class Voter {

  constructor(id, eid, fname, lname, mail) {
      this.voterId = id;
      this.electionId = eid;
      this.firstName = fname;
      this.lastName = lname;
      this.email = mail;
      this.voted = false;
      this.type = 'voter';
      if (this.__isContract) {
        delete this.__isContract;
      }
      return this;
  }
}
module.exports = Voter;