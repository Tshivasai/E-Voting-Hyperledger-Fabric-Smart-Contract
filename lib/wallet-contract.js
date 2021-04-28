/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const Voter = require('./Voter.js');
const Election = require('./Election.js');
const Party = require('./Party.js');

class WalletContract extends Contract {

    async createElection(ctx, args){
      try{
        args = JSON.parse(args);
        let currElections = JSON.parse(await this.queryByObjectType(ctx, 'election'));
        let electionNameExists = false;
        let elecObj;
        if(currElections.length != 0){
          for(elecObj of currElections){
            if(elecObj.Record.name == args.electionName){
              electionNameExists = true;
              break;
            }
          }
        }
        if(!electionNameExists){
          let election = await new Election(args.electionName, args.electionYear, args.electionStartDate, args.electionEndDate);
          await ctx.stub.putState(election.electionId, Buffer.from(JSON.stringify(election)));
          return {msg: "Election " + args.electionName + " Successfully Created", res: true};
        }
        else{
          return {msg : "Election Name Already Exists", res: false};
        }
      }
      catch(error){
        return {msg : error, res: false};
      }
    }

    async returnParties(ctx, args){
      try{
        args = JSON.parse(args);
        let parties = [];
        let election = await this.readWallet(ctx, args.electionId);
        for(let i of election.partyIds){
          let party = await this.readWallet(ctx, i);
          let partyObj = {partyName : party.name, partyId : party.partyId};
          parties.push(partyObj);
        }
        return parties;
      }
      catch(error){
        return error;
      }
    }

    async returnVoterElections(ctx, args){
      try{
        args = JSON.parse(args);
        let voter = await this.readWallet(ctx, args.voterId);
        let election = await this.readWallet(ctx, voter.electionId);
        let reElect = {electionId : voter.electionId, electionName : election.name}
        return reElect; 
      }
      catch(error){
        return "error";
      }
    }

    async returnElections(ctx){
      try{
        let currentElections = JSON.parse(await this.queryByObjectType(ctx, 'election'));
        let elections = [];
        for(let i of currentElections){
          let electionObj = {electionName : i.Record.name, electionId : i.Record.electionId};
          elections.push(electionObj);
        }
        return elections; 
      }
      catch(error){
        return error;
      }
    } 

    async createParty(ctx, args){
      try{
        args = JSON.parse(args);
        let electionExists = await this.walletExists(ctx, args.electionId);
        if(electionExists){
          //let election = await this.readWallet(ctx, agrs.electionId);
          let buffer = await ctx.stub.getState(args.electionId);
          let election = JSON.parse(buffer.toString());
          let partyExists = false;
          for(let i of election.partyIds){
            let partyBuffer = await ctx.stub.getState(i);
            let party = JSON.parse(partyBuffer.toString());
            if(party.name == args.partyName)
              partyExists = true;
          }
          if(!partyExists){
            let party = new Party(args.electionId, args.partyName, args.partyDescription);
            let currParties = election.partyIds;
            currParties.push(party.partyId);
            election.partyIds = currParties;
            await ctx.stub.putState(party.partyId, Buffer.from(JSON.stringify(party)));
            await ctx.stub.putState(args.electionId, Buffer.from(JSON.stringify(election)));
            return {msg: "Party " + args.partyName + " Successfully Created", res: true};
          }
          else {
            return {msg : "Party Name Already Exists", res: false};
          }
        }
        else {
          return {msg : "Election Does Not Exists", res: false};
        }
      }
      catch (error){
        return {msg : error, res: false};
      }
    }

    async createVoter(ctx, args){
      try{
        args = JSON.parse(args);
        let voterExists = JSON.parse(await this.walletExists(ctx, args.voterId));
        if(!voterExists){
            let voter = await new Voter(args.voterId, args.electionId, args.firstName, args.lastName, args.email);
            await ctx.stub.putState(args.voterId, Buffer.from(JSON.stringify(voter)));
            return {msg: "Voter " + args.voterId + " Successfully Created", res: true};
        }
        else{
            return {msg : "Voter Already Exists", res: false};
        }
      }
      catch(error){
        return {msg : error, res: false};
      }
    }

    async returnResult(ctx, args){
      try{
        args = JSON.parse(args);
        let parties = [];
        let election = await this.readWallet(ctx, args.electionId);
        for(let i of election.partyIds){
          let party = await this.readWallet(ctx, i);
          let partyObj = {partyName : party.name, voteCount: party.count};
          parties.push(partyObj);
        }
        return parties;
      }
      catch(error){
        return error;
      }
    }

    async castVote(ctx, args){
      try{
        args = JSON.parse(args);
        let electionExists = await this.walletExists(ctx, args.electionId);
        let partyExists = await this.walletExists(ctx, args.partyId);
        let voterAsBytes = await ctx.stub.getState(args.voterId);
        let voter = await JSON.parse(voterAsBytes);
  
        if(electionExists && voter.electionId == args.electionId){
          if(partyExists){
            let partyAsBytes = await ctx.stub.getState(args.partyId);
            let party = await JSON.parse(partyAsBytes);
            if(party.electionId == args.electionId){
  
              let electionAsBytes = await ctx.stub.getState(args.electionId);
              let election = await JSON.parse(electionAsBytes);
              if(voter.voted){
                return {msg : "Voter With ID " + voter.voterId + " Has Already Voted", res: false};
              }
              else{
                let currentTime = await new Date();
                let parsedCurrentTime = await Date.parse(currentTime);
                let electionStart = await new Date(election.startDate);
                let parsedElectionStart = await Date.parse(electionStart);
                let electionEnd = await new Date(election.endDate);
                let parsedElectionEnd = await Date.parse(electionEnd);
      
                if (parsedCurrentTime >= parsedElectionStart && parsedCurrentTime < parsedElectionEnd){
                  await party.count++;
                  await ctx.stub.putState(args.partyId, Buffer.from(JSON.stringify(party)));
                  voter.voted = true;
                  await ctx.stub.putState(voter.voterId, Buffer.from(JSON.stringify(voter)));
                  return {msg: "Vote Casted", res: true};
                }
                else if(parsedCurrentTime > parsedElectionEnd){
                  return {msg : "Election Ended", res: false};
                }
                else {
                  return {msg : "Wait For Election To Start,Start Date " + electionStart + ", Current Date" + currentTime, res: false};
                }
              }
            }
            else {
              return {msg : "Party and Election ID do Not Match", res: false};
            }
          }
          else {
            return {msg : "Party Does Not Exist", res: false};
          }
        }
        else {
          return {msg : "Election Does Not Exist Or Voter Cannot Vote For This Election", res: false};
        }
      }
      catch(error){
        return {msg : error, res: false};
      }
    }

    async walletExists(ctx, walletId) {
        const buffer = await ctx.stub.getState(walletId);
        return (!!buffer && buffer.length > 0);
    }

    async createWallet(ctx, walletId, value) {
        //let wallet = Network.newFileSystemWallet("/wallet")
        const exists = await this.walletExists(ctx, walletId);
        if (exists) {
            throw new Error(`The wallet ${walletId} already exists`);
        }
        const asset = { value };
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(walletId, buffer);
    }

    async readWallet(ctx, walletId) {
        const exists = await this.walletExists(ctx, walletId);
        if (!exists) {
            throw new Error(`The wallet ${walletId} does not exist`);
        }
        const buffer = await ctx.stub.getState(walletId);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

    async updateWallet(ctx, walletId, newValue) {
        const exists = await this.walletExists(ctx, walletId);
        if (!exists) {
            throw new Error(`The wallet ${walletId} does not exist`);
        }
        const asset = { value: newValue };
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(walletId, buffer);
    }

    async deleteWallet(ctx, walletId) {
        const exists = await this.walletExists(ctx, walletId);
        if (!exists) {
            throw new Error(`The wallet ${walletId} does not exist`);
        }
        await ctx.stub.deleteState(walletId);
    }

    async queryAll(ctx) {
        let queryString = {
          selector: {}
        };
        let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return queryResults;
    }

    async queryWithQueryString(ctx, queryString) {
      try{
        console.log('query String');
        console.log(JSON.stringify(queryString));
    
        let resultsIterator = await ctx.stub.getQueryResult(queryString);
    
        let allResults = [];
    
        // eslint-disable-next-line no-constant-condition
        while (true) {
          let res = await resultsIterator.next();
    
          if (res.value && res.value.value.toString()) {
            let jsonRes = {};
    
            console.log(res.value.value.toString('utf8'));
    
            jsonRes.Key = res.value.key;
    
            try {
              jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
            } catch (err) {
              console.log(err);
              jsonRes.Record = res.value.value.toString('utf8');
            }
    
            allResults.push(jsonRes);
          }
          if (res.done) {
            console.log('end of data');
            await resultsIterator.close();
            console.info(allResults);
            console.log(JSON.stringify(allResults));
            return JSON.stringify(allResults);
          }
        }
      }
      catch(error){
        return error;
      }
      }

    async queryByObjectType(ctx, objectType) {
        let queryString = {
          selector: {
            type: objectType
          }
        };
        let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return queryResults;
    }

    async queryByObjectName(ctx, objectType) {
        let queryString = {
          selector: {
            name: objectType
          }
        };
        let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return queryResults;
    }
}

module.exports = WalletContract;
