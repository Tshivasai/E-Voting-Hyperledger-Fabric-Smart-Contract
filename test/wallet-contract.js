/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { ChaincodeStub, ClientIdentity } = require('fabric-shim');
const { WalletContract } = require('..');
const winston = require('winston');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext {

    constructor() {
        this.stub = sinon.createStubInstance(ChaincodeStub);
        this.clientIdentity = sinon.createStubInstance(ClientIdentity);
        this.logger = {
            getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
            setLevel: sinon.stub(),
        };
    }

}

describe('WalletContract', () => {

    let contract;
    let ctx;

    beforeEach(() => {
        contract = new WalletContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"wallet 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"wallet 1002 value"}'));
    });

    describe('#walletExists', () => {

        it('should return true for a wallet', async () => {
            await contract.walletExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a wallet that does not exist', async () => {
            await contract.walletExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createWallet', () => {

        it('should create a wallet', async () => {
            await contract.createWallet(ctx, '1003', 'wallet 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"wallet 1003 value"}'));
        });

        it('should throw an error for a wallet that already exists', async () => {
            await contract.createWallet(ctx, '1001', 'myvalue').should.be.rejectedWith(/The wallet 1001 already exists/);
        });

    });

    describe('#readWallet', () => {

        it('should return a wallet', async () => {
            await contract.readWallet(ctx, '1001').should.eventually.deep.equal({ value: 'wallet 1001 value' });
        });

        it('should throw an error for a wallet that does not exist', async () => {
            await contract.readWallet(ctx, '1003').should.be.rejectedWith(/The wallet 1003 does not exist/);
        });

    });

    describe('#updateWallet', () => {

        it('should update a wallet', async () => {
            await contract.updateWallet(ctx, '1001', 'wallet 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"wallet 1001 new value"}'));
        });

        it('should throw an error for a wallet that does not exist', async () => {
            await contract.updateWallet(ctx, '1003', 'wallet 1003 new value').should.be.rejectedWith(/The wallet 1003 does not exist/);
        });

    });

    describe('#deleteWallet', () => {

        it('should delete a wallet', async () => {
            await contract.deleteWallet(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a wallet that does not exist', async () => {
            await contract.deleteWallet(ctx, '1003').should.be.rejectedWith(/The wallet 1003 does not exist/);
        });

    });

});
