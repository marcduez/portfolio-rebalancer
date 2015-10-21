/// <reference path="../src/Portfolio.js" />
/// <reference path="../lib/jasmine-2.3.4/jasmine.js" />

describe("Portfolio", function () {

    describe("saveInvestment method", function () {

        /**
         * Asserts that the save-investment method adds and updates investments.
         */
        it("adds and replaces investments", function () {
            var portfolio = new Portfolio();

            // Add AAPL investment.
            portfolio.saveInvestment("aapl", 1, 5);
            expect(portfolio.getInvestments()).toEqual([
                {
                    ticker: "aapl", sharesOwned: 1, sharePrice: 5, actualAllocation: 100
                }]);

            // Add GOOG investment.
            portfolio.saveInvestment("goog", 1, 5);
            expect(portfolio.getInvestments()).toEqual([
                {
                    ticker: "aapl", sharesOwned: 1, sharePrice: 5, actualAllocation: 50
                },
                {
                    ticker: "goog", sharesOwned: 1, sharePrice: 5, actualAllocation: 50
                }]);

            // Update AAPL investment.
            portfolio.saveInvestment("AAPL", 2, 5);
            expect(portfolio.getInvestments()).toEqual([
                {
                    ticker: "aapl", sharesOwned: 2, sharePrice: 5, actualAllocation: 66.67
                },
                {
                    ticker: "goog", sharesOwned: 1, sharePrice: 5, actualAllocation: 33.33
                }]);
        });
    });

    describe("deleteInvestment method", function () {

        /**
         * Asserts that the delete-investment method removes investments. 
         */
        it("produces expected result", function () {
            var portfolio = new Portfolio();
            portfolio.saveInvestment("aapl", 1, 5);
            portfolio.saveInvestment("goog", 1, 5);
            expect(portfolio.getInvestments()).toEqual([
                {
                    ticker: "aapl", sharesOwned: 1, sharePrice: 5, actualAllocation: 50
                },
                {
                    ticker: "goog", sharesOwned: 1, sharePrice: 5, actualAllocation: 50
                }]);

            // Delete AAPL investment.
            portfolio.deleteInvestment("AAPL");
            expect(portfolio.getInvestments()).toEqual([
                {
                    ticker: "goog", sharesOwned: 1, sharePrice: 5, actualAllocation: 100
                }]);
        });
    });

    describe("getTotalValue method", function () {

        /**
         * Asserts that the get-total-value method returns 0 for an empty portfolio.
         */
        it("returns 0 for empty portfolio", function () {
            expect(new Portfolio().getTotalValue()).toEqual(0);
        });

        /**
         * Asserts that the get-total-value method returns the correct value.
         */
        it("returns correct value", function () {
            var portfolio = new Portfolio();
            portfolio.saveInvestment("aapl", 2, 5.50);
            portfolio.saveInvestment("goog", 3, 4.15);
            expect(portfolio.getTotalValue()).toEqual(23.45); // (2 * 5.5) + (3 * 4.15)
        });
    });

    describe("rebalance method", function () {

        /**
         * Asserts that the rebalance method throws when the target allocations references a share not found in the
         * portfolio.
         */
        it("throws on invalid ticker in targetAllocations", function () {
            expect(function () {
                new Portfolio().rebalance({ "aapl": 50 })
            }).toThrowError("Could not find share price for ticker 'AAPL'.");
        });

        /**
         * Asserts that the rebalance method throws when target allocations don't add up to 100%.
         */
        it("throws on target allocations not adding up to 100%", function () {
            expect(function () {
                var portfolio = new Portfolio();
                portfolio.saveInvestment("aapl", 2, 5.50);
                portfolio.rebalance({ "aapl": 50 })
            }).toThrowError("Target allocations must add up to 100%.");
        });

        /**
         * Asserts that the rebalance method returns the correct value.
         */
        it("returns correct value", function () {
            var portfolio = new Portfolio();
            portfolio.saveInvestment("aapl", 6, 4); // 75%
            portfolio.saveInvestment("goog", 4, 2); // 25%
            expect(portfolio.rebalance({ "aapl": 50, "goog": 50 })).toEqual([{ ticker: "aapl", shares: -2 }, { ticker: "goog", shares: 4 }]);
        });

        /**
         * Asserts that the rebalance method returns no buy/sell instructions when the pre-rebalanced state is closer
         * to the desired outcome than the post-rebalanced state.
         */
        it("stops when rebalanced values are worse than original values", function () {
            var portfolio = new Portfolio();
            portfolio.saveInvestment("aapl", 158, 101.28);
            portfolio.saveInvestment("goog", 180, 252.85);
            expect(portfolio.rebalance({ "aapl": 26, "goog": 74 })).toEqual([]);
        });
    });
});