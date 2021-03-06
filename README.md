# Portfolio Rebalancer

Marc Duez  
marcduez@gmail.com

This response to the coding challenge uses JavaScript, with unit tests in Jasmine. There is an HTML GUI that can be used to exercise the code (I saw the no-UI instruction, and the unit tests should stand on their own, but it was useful for running scenarios), and an HTML GUI for the Jasmine test runner.

The logic is provided by Portfolio.js. Portfolio is a JavaScript "class" which exposes instance methods for building and rebalancing a portfolio.

I don't advocate the use of JavaScript for most tasks, but I'm not a Java or Ruby developer (C# is my language of choice), so I wouldn't know how to set up an environment, or send you a code sample in a project format you would want.

Also please note that the JavaScript in the interface intentionally throw-away, and should not be interpreted as my preferred approach to wiring GUIs. Normally I would do GUIs in Angular, but the two-way binding that would suit the GUI, and the infrastructure code would have dwarfed the code relevant to the assignment.

## Room For Improvement
The algorithm that rebalances the portfolio is quite naïve - it tries to get as many shares as it can with the allocated percentage of the total portfolio value. As a result, in the GUI, if you apply the buy and sell orders, it will come back with more suggestions because the total portfolio value has changed. I could have limited that by having an "unused funds" value, to account for money left over after the buys and sells are applied. I also don't try to fill the fund with cheaper shares using leftover money (knapsack-problem style).
