/**
 * Portfolio.
 * @constructor
 */
var Portfolio = function () {
    this._investments = [];
    this._investmentsCache = null;
    this._totalValueCache = null;
};

/**
 * Saves the provided investment in this portfolio.
 * @param {string} ticker - The ticker of the share.
 * @param {number} sharesOwned - The number of shares owned.
 * @param {number} sharePrice - The per-unit price of the share.
 */
Portfolio.prototype.saveInvestment = function (ticker, sharesOwned, sharePrice) {
    var tickerLower = ticker.toLowerCase();
    var sharePriceInt = Math.round(sharePrice * 100);
    var found = false;
    for (var i = 0, il = this._investments.length; i < il; ++i) {
        if (this._investments[i].ticker !== tickerLower) {
            continue;
        }

        // Matching investment found. Update existing investment.
        found = true;
        this._investments[i].sharesOwned = sharesOwned;
        this._investments[i].sharePrice = sharePriceInt;
        break;
    }

    if (!found) {
        // No matching investment found. Add new investment.
        this._investments.push({
            ticker: ticker.toLowerCase(),
            sharesOwned: sharesOwned,
            sharePrice: sharePriceInt
        });
    }

    // Clear cached values.
    this._investmentsCache = null;
    this._totalValueCache = null;
};

/**
 * Deletes the investment with the provided ticker from this portfolio.
 * @param {string} ticker - The ticker of the share.
 */
Portfolio.prototype.deleteInvestment = function (ticker) {
    var tickerLower = ticker.toLowerCase();
    for (var i = 0, il = this._investments.length; i < il; ++i) {
        if (this._investments[i].ticker === tickerLower) {
            // Remove investment from array.
            this._investments.splice(i, 1);

            // Clear cached values.
            this._investmentsCache = null;
            this._totalValueCache = null;
            return;
        }
    }
};

/**
 * Returns a deep copy of this portfolio's investments.
 * @returns {Object[]} - The investments in this portfolio.
 */
Portfolio.prototype.getInvestments = function () {
    if (this._investmentsCache !== null)
        return this._investmentsCache;

    var totalValue = this.getTotalValue();
    return this._investmentsCache = this._investments.map(function (x) {
        var investmentValue = x.sharesOwned * x.sharePrice;
        var actualAllocation = parseFloat((investmentValue / totalValue).toFixed(2));
        return {
            ticker: x.ticker,
            sharesOwned: x.sharesOwned,
            sharePrice: parseFloat((x.sharePrice / 100).toFixed(2)),
            actualAllocation: actualAllocation
        };
    });
};

/**
 * Returns the total value of this portfolio.
 * returns {number} - The total value of this portfolio.
 */
Portfolio.prototype.getTotalValue = function () {
    if (this._totalValueCache !== null)
        return this._totalValueCache;

    var totalValue = this._investments.reduce(function (prev, current) {
        return prev + Math.round(current.sharesOwned * current.sharePrice);
    }, 0);

    return this._totalValueCache = parseFloat((totalValue / 100).toFixed(2));
};

/**
 * Returns the buys and sells required to adjust the portfolio to the provided allocations.
 * Assumes that less money than original portfolio can be spent, but not more.
 * @param {Object} targetAllocations - The target allocations.
 * @returns {Object[]} - The buys and sells to perform.
 * @example
 * portfolio.rebalance({"AAPL": 52, "GOOG": 48})
 *      => [{ticker: "aapl", shares: -12}, {ticker:" goog", shares: 32}]
 */
Portfolio.prototype.rebalance = function (targetAllocations) {

    // Clone provided target-allocations object, since we don't want unexpected side effects.
    var targetAllocationsClone = {};
    for (var key in targetAllocations) {
        if (!targetAllocations.hasOwnProperty(key)) {
            continue;
        }
        targetAllocationsClone[key.toLowerCase()] = targetAllocations[key];
    }

    // Construct an instruction object for each investment in this portfolio.
    var investments = this.getInvestments();
    var instructions = [];
    var totalAllocation = 0;
    for (var i = 0, il = investments.length; i < il; ++i) {
        var investment = investments[i];

        // Get target allocation for investment ticker.
        // If target allocation exists, delete from target-allocations object.
        var targetAllocation = targetAllocationsClone.hasOwnProperty(investment.ticker)
            ? parseInt(targetAllocationsClone[investment.ticker], 10)
            : 0;
        delete targetAllocationsClone[investment.ticker];

        instructions.push({
            ticker: investment.ticker,
            sharePrice: Math.round(investment.sharePrice * 100),
            actualSharesOwned: investment.sharesOwned,
            rebalancedSharesOwned: 0,
            actualAllocation: investment.actualAllocation,
            targetAllocation: targetAllocation
        });
        totalAllocation += targetAllocation;
    }

    // By now all keys should have been removed from our target-allocations object.
    // Otherwise, throw.
    for (var key in targetAllocationsClone) {
        if (!targetAllocations.hasOwnProperty(key)) {
            continue;
        }
        throw new Error("Could not find share price for ticker '" + key.toUpperCase() + "'.");
    }

    // Throw if target allocation doesn't describe 100% of the portfolio.
    if (totalAllocation !== 100) {
        throw new Error("Target allocations must add up to 100%.");
    }

    var actualTotalValue = Math.round(this.getTotalValue() * 100);

    // Calculate how many of each share to buy and sell.
    // The target number of shares is the largest number that can be purchased with the target allocation's percentage
    // of the total portfolio value.
    var result = [];
    var rebalancedTotalValue = 0;
    for (var i = 0, il = instructions.length; i < il; ++i) {
        var instruction = instructions[i];
        var targetInvestmentValue = actualTotalValue * instruction.targetAllocation / 100;
        instruction.rebalancedSharesOwned = Math.floor(targetInvestmentValue / instruction.sharePrice);
        rebalancedTotalValue += instruction.rebalancedSharesOwned * instruction.sharePrice;
        if (instruction.rebalancedSharesOwned !== instruction.actualSharesOwned) {
            result.push({
                ticker: instruction.ticker,
                shares: instruction.rebalancedSharesOwned - instruction.actualSharesOwned
            });
        }
    }

    // Compare magnitude of offset of current portfolio from magnitude of offset of rebalanced portfolio.
    // Otherwise, unless the numbers line up perfectly, a buy or sell is basically always suggested.
    var actualOffset = 0;
    var rebalancedOffset = 0;
    for (var i = 0, il = instructions.length; i < il; ++i) {
        var instruction = instructions[i];
        actualOffset += Math.abs(instruction.targetAllocation - instruction.actualAllocation);
        var rebalancedInvestmentValue = instruction.rebalancedSharesOwned * instruction.sharePrice;
        var rebalancedAllocation = parseFloat((rebalancedInvestmentValue / rebalancedTotalValue * 100).toFixed(2));
        rebalancedOffset += Math.abs(instruction.targetAllocation - rebalancedAllocation);
    }

    return (rebalancedOffset < actualOffset) ? result : [];
}