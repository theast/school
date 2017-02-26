// Interface definitions for worlds
///<reference path="World.ts"/>
///<reference path="lib/node.d.ts"/>
/**
* Parser module
*
* This module parses a command given as a string by the user into a
* list of possible parses, each of which contains an object of type
* `Command`.
*
*/
var Parser;
(function (Parser) {
    //////////////////////////////////////////////////////////////////////
    // exported functions, classes and interfaces/types
    function parse(input) {
        var nearleyParser = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
        var parsestr = input.toLowerCase().replace(/\W/g, "");
        try {
            var results = nearleyParser.feed(parsestr).results;
        }
        catch (err) {
            if ('offset' in err) {
                throw new Error('Parsing failed after ' + err.offset + ' characters');
            }
            else {
                throw err;
            }
        }
        if (!results.length) {
            throw new Error('Parsing failed, incomplete input');
        }
        return results.map(function (res) {
            // We need to clone the parse result, because parts of it is shared with other parses
            return { input: input, parse: clone(res) };
        });
    }
    Parser.parse = parse;
    function stringify(result) {
        return JSON.stringify(result.parse);
    }
    Parser.stringify = stringify;
    //////////////////////////////////////////////////////////////////////
    // Utilities
    function clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
})(Parser || (Parser = {}));
if (typeof require !== 'undefined') {
    // Node.JS way of importing external modules
    // In a browser, they must be included from the HTML file
    var nearley = require('./lib/nearley.js');
    var grammar = require('./grammar.js');
}
///<reference path="World.ts"/>
///<reference path="Parser.ts"/>
/**
* Interpreter module
*
* The goal of the Interpreter module is to interpret a sentence
* written by the user in the context of the current world state. In
* particular, it must figure out which objects in the world,
* i.e. which elements in the `objects` field of WorldState, correspond
* to the ones referred to in the sentence.
*
* Moreover, it has to derive what the intended goal state is and
* return it as a logical formula described in terms of literals, where
* each literal represents a relation among objects that should
* hold. For example, assuming a world state where "a" is a ball and
* "b" is a table, the command "put the ball on the table" can be
* interpreted as the literal ontop(a,b). More complex goals can be
* written using conjunctions and disjunctions of these literals.
*
* In general, the module can take a list of possible parses and return
* a list of possible interpretations, but the code to handle this has
* already been written for you. The only part you need to implement is
* the core interpretation function, namely `interpretCommand`, which produces a
* single interpretation for a single command.
*/
var Interpreter;
(function (Interpreter) {
    //////////////////////////////////////////////////////////////////////
    // exported functions, classes and interfaces/types
    /**
    Top-level function for the Interpreter. It calls `interpretCommand` for each possible parse of the command. No need to change this one.
    * @param parses List of parses produced by the Parser.
    * @param currentState The current state of the world.
    * @returns Augments ParseResult with a list of interpretations. Each interpretation is represented by a list of Literals.
    */
    function interpret(parses, currentState) {
        var errors = [];
        var interpretations = [];
        parses.forEach(function (parseresult) {
            try {
                var result = parseresult;
                result.interpretation = interpretCommand(result.parse, currentState);
                interpretations.push(result);
            }
            catch (err) {
                errors.push(err);
            }
        });
        if (interpretations.length) {
            return interpretations;
        }
        else {
            // only throw the first error found
            throw errors[0];
        }
    }
    Interpreter.interpret = interpret;
    function stringify(result) {
        return result.interpretation.map(function (literals) {
            return literals.map(function (lit) { return stringifyLiteral(lit); }).join(" & ");
            // return literals.map(stringifyLiteral).join(" & ");
        }).join(" | ");
    }
    Interpreter.stringify = stringify;
    function stringifyLiteral(lit) {
        return (lit.polarity ? "" : "-") + lit.relation + "(" + lit.args.join(",") + ")";
    }
    Interpreter.stringifyLiteral = stringifyLiteral;
    //////////////////////////////////////////////////////////////////////
    // private functions
    /**
     * The core interpretation function. The code here is just a
     * template; you should rewrite this function entirely. In this
     * template, the code produces a dummy interpretation which is not
     * connected to `cmd`, but your version of the function should
     * analyse cmd in order to figure out what interpretation to
     * return.
     * @param cmd The actual command. Note that it is *not* a string, but rather an object of type `Command` (as it has been parsed by the parser).
     * @param state The current state of the world. Useful to look up objects in the world.
     * @returns A list of list of Literal, representing a formula in disjunctive normal form (disjunction of conjunctions). See the dummy interpetation returned in the code for an example, which means ontop(a,floor) AND holding(b).
     */
    function interpretCommand(cmd, state) {
        // This returns a dummy interpretation involving two random objects in the world
        var objects = Array.prototype.concat.apply([], state.stacks);
        var a = objects[Math.floor(Math.random() * objects.length)];
        var b = objects[Math.floor(Math.random() * objects.length)];
        var interpretation = [[
                { polarity: true, relation: "ontop", args: [a, "floor"] },
                { polarity: true, relation: "holding", args: [b] }
            ]];
        console.log(cmd);
        return interpretation;
    }
})(Interpreter || (Interpreter = {}));
///<reference path="World.ts"/>
///<reference path="Interpreter.ts"/>
/**
* Planner module
*
* The goal of the Planner module is to take the interpetation(s)
* produced by the Interpreter module and to plan a sequence of actions
* for the robot to put the world into a state compatible with the
* user's command, i.e. to achieve what the user wanted.
*
* The planner should use your A* search implementation to find a plan.
*/
var Planner;
(function (Planner) {
    //////////////////////////////////////////////////////////////////////
    // exported functions, classes and interfaces/types
    /**
     * Top-level driver for the Planner. Calls `planInterpretation` for each given interpretation generated by the Interpreter.
     * @param interpretations List of possible interpretations.
     * @param currentState The current state of the world.
     * @returns Augments Interpreter.InterpretationResult with a plan represented by a list of strings.
     */
    function plan(interpretations, currentState) {
        var errors = [];
        var plans = [];
        interpretations.forEach(function (interpretation) {
            try {
                var result = interpretation;
                result.plan = planInterpretation(result.interpretation, currentState);
                if (result.plan.length == 0) {
                    result.plan.push("That is already true!");
                }
                plans.push(result);
            }
            catch (err) {
                errors.push(err);
            }
        });
        if (plans.length) {
            return plans;
        }
        else {
            // only throw the first error found
            throw errors[0];
        }
    }
    Planner.plan = plan;
    function stringify(result) {
        return result.plan.join(", ");
    }
    Planner.stringify = stringify;
    //////////////////////////////////////////////////////////////////////
    // private functions
    /**
     * The core planner function. The code here is just a template;
     * you should rewrite this function entirely. In this template,
     * the code produces a dummy plan which is not connected to the
     * argument `interpretation`, but your version of the function
     * should be such that the resulting plan depends on
     * `interpretation`.
     *
     *
     * @param interpretation The logical interpretation of the user's desired goal. The plan needs to be such that by executing it, the world is put into a state that satisfies this goal.
     * @param state The current world state.
     * @returns Basically, a plan is a
     * stack of strings, which are either system utterances that
     * explain what the robot is doing (e.g. "Moving left") or actual
     * actions for the robot to perform, encoded as "l", "r", "p", or
     * "d". The code shows how to build a plan. Each step of the plan can
     * be added using the `push` method.
     */
    function planInterpretation(interpretation, state) {
        // This function returns a dummy plan involving a random stack
        do {
            var pickstack = Math.floor(Math.random() * state.stacks.length);
        } while (state.stacks[pickstack].length == 0);
        var plan = [];
        // First move the arm to the leftmost nonempty stack
        if (pickstack < state.arm) {
            plan.push("Moving left");
            for (var i = state.arm; i > pickstack; i--) {
                plan.push("l");
            }
        }
        else if (pickstack > state.arm) {
            plan.push("Moving right");
            for (var i = state.arm; i < pickstack; i++) {
                plan.push("r");
            }
        }
        // Then pick up the object
        var obj = state.stacks[pickstack][state.stacks[pickstack].length - 1];
        plan.push("Picking up the " + state.objects[obj].form, "p");
        if (pickstack < state.stacks.length - 1) {
            // Then move to the rightmost stack
            plan.push("Moving as far right as possible");
            for (var i = pickstack; i < state.stacks.length - 1; i++) {
                plan.push("r");
            }
            // Then move back
            plan.push("Moving back");
            for (var i = state.stacks.length - 1; i > pickstack; i--) {
                plan.push("l");
            }
        }
        // Finally put it down again
        plan.push("Dropping the " + state.objects[obj].form, "d");
        return plan;
    }
})(Planner || (Planner = {}));
///<reference path="World.ts"/>
///<reference path="Parser.ts"/>
///<reference path="Interpreter.ts"/>
///<reference path="Planner.ts"/>
var Shrdlite;
(function (Shrdlite) {
    function interactive(world) {
        function endlessLoop(utterance) {
            if (utterance === void 0) { utterance = ""; }
            var inputPrompt = "What can I do for you today? ";
            var nextInput = function () { return world.readUserInput(inputPrompt, endlessLoop); };
            if (utterance.trim()) {
                var plan = splitStringIntoPlan(utterance);
                if (!plan) {
                    plan = parseUtteranceIntoPlan(world, utterance);
                }
                if (plan) {
                    world.printDebugInfo("Plan: " + plan.join(", "));
                    world.performPlan(plan, nextInput);
                    return;
                }
            }
            nextInput();
        }
        world.printWorld(endlessLoop);
    }
    Shrdlite.interactive = interactive;
    /**
     * Generic function that takes an utterance and returns a plan. It works according to the following pipeline:
     * - first it parses the utterance (Parser.ts)
     * - then it interprets the parse(s) (Interpreter.ts)
     * - then it creates plan(s) for the interpretation(s) (Planner.ts)
     *
     * Each of the modules Parser.ts, Interpreter.ts and Planner.ts
     * defines its own version of interface Result, which in the case
     * of Interpreter.ts and Planner.ts extends the Result interface
     * from the previous module in the pipeline. In essence, starting
     * from ParseResult, each module that it passes through adds its
     * own result to this structure, since each Result is fed
     * (directly or indirectly) into the next module.
     *
     * There are two sources of ambiguity: a parse might have several
     * possible interpretations, and there might be more than one plan
     * for each interpretation. In the code there are placeholders
     * that you can fill in to decide what to do in each case.
     *
     * @param world The current world.
     * @param utterance The string that represents the command.
     * @returns A plan in the form of a stack of strings, where each element is either a robot action, like "p" (for pick up) or "r" (for going right), or a system utterance in English that describes what the robot is doing.
     */
    function parseUtteranceIntoPlan(world, utterance) {
        // Parsing
        world.printDebugInfo('Parsing utterance: "' + utterance + '"');
        try {
            var parses = Parser.parse(utterance);
            world.printDebugInfo("Found " + parses.length + " parses");
            parses.forEach(function (result, n) {
                world.printDebugInfo("  (" + n + ") " + Parser.stringify(result));
            });
        }
        catch (err) {
            world.printError("Parsing error", err);
            return;
        }
        // Interpretation
        try {
            var interpretations = Interpreter.interpret(parses, world.currentState);
            world.printDebugInfo("Found " + interpretations.length + " interpretations");
            interpretations.forEach(function (result, n) {
                world.printDebugInfo("  (" + n + ") " + Interpreter.stringify(result));
            });
            if (interpretations.length > 1) {
            }
        }
        catch (err) {
            world.printError("Interpretation error", err);
            return;
        }
        // Planning
        try {
            var plans = Planner.plan(interpretations, world.currentState);
            world.printDebugInfo("Found " + plans.length + " plans");
            plans.forEach(function (result, n) {
                world.printDebugInfo("  (" + n + ") " + Planner.stringify(result));
            });
            if (plans.length > 1) {
            }
        }
        catch (err) {
            world.printError("Planning error", err);
            return;
        }
        var finalPlan = plans[0].plan;
        world.printDebugInfo("Final plan: " + finalPlan.join(", "));
        return finalPlan;
    }
    Shrdlite.parseUtteranceIntoPlan = parseUtteranceIntoPlan;
    /** This is a convenience function that recognizes strings
     * of the form "p r r d l p r d"
     */
    function splitStringIntoPlan(planstring) {
        var plan = planstring.trim().split(/\s+/);
        var actions = { p: "Picking", d: "Dropping", l: "Going left", r: "Going right" };
        for (var i = plan.length - 1; i >= 0; i--) {
            if (!actions[plan[i]]) {
                return;
            }
            plan.splice(i, 0, actions[plan[i]]);
        }
        return plan;
    }
    Shrdlite.splitStringIntoPlan = splitStringIntoPlan;
})(Shrdlite || (Shrdlite = {}));
///<reference path="World.ts"/>
///<reference path="lib/node.d.ts"/>
var TextWorld = (function () {
    function TextWorld(currentState) {
        this.currentState = currentState;
        if (!this.currentState.arm)
            this.currentState.arm = 0;
        if (this.currentState.holding)
            this.currentState.holding = null;
    }
    TextWorld.prototype.readUserInput = function (prompt, callback) {
        throw "Not implemented!";
    };
    TextWorld.prototype.printSystemOutput = function (output, participant) {
        if (participant == "user") {
            output = '"' + output + '"';
        }
        console.log(output);
    };
    TextWorld.prototype.printDebugInfo = function (info) {
        console.log(info);
    };
    TextWorld.prototype.printError = function (error, message) {
        console.error(error, message);
    };
    TextWorld.prototype.printWorld = function (callback) {
        var _this = this;
        var world = this;
        console.log();
        var stacks = this.currentState.stacks;
        var maxHeight = Math.max.apply(null, stacks.map(function (s) { return s.length; }));
        var stackWidth = 3 + Math.max.apply(null, stacks.map(function (s) {
            return Math.max.apply(null, s.map(function (o) { return o.length; }));
        }));
        var line = Array(this.currentState.arm * stackWidth).join(" ");
        console.log(line + this.centerString("\\_/", stackWidth));
        if (this.currentState.holding) {
            console.log(line + this.centerString(this.currentState.holding, stackWidth));
        }
        for (var y = maxHeight; y >= 0; y--) {
            var line = "";
            for (var x = 0; x < stacks.length; x++) {
                var obj = stacks[x][y] || "";
                line += this.centerString(obj, stackWidth);
            }
            console.log(line);
        }
        console.log("+" + Array(1 + stacks.length).join(Array(stackWidth).join("-") + "+"));
        var line = "";
        for (var x = 0; x < stacks.length; x++) {
            line += this.centerString(x + "", stackWidth);
        }
        console.log(line);
        console.log();
        var printObject = function (obj) {
            var props = world.currentState.objects[obj];
            console.log(_this.centerString(obj, stackWidth) + ": " +
                props.form + ", " + props.size + ", " + props.color);
            // Object.keys(props).map((k) => {return props[k]}).join(", "));
        };
        if (this.currentState.holding)
            printObject(this.currentState.holding);
        stacks.forEach(function (stack) { return stack.forEach(printObject); });
        console.log();
        if (callback)
            callback();
    };
    TextWorld.prototype.performPlan = function (plan, callback) {
        var planctr = 0;
        var world = this;
        function performNextAction() {
            planctr++;
            if (plan && plan.length) {
                var item = plan.shift().trim();
                var action = world.getAction(item);
                if (action) {
                    try {
                        action.call(world, performNextAction);
                    }
                    catch (err) {
                        world.printSystemOutput("ERROR: " + err);
                        if (callback)
                            setTimeout(callback, 1);
                    }
                }
                else {
                    if (item && item[0] != "#") {
                        world.printSystemOutput(item);
                    }
                    performNextAction();
                }
            }
            else {
                if (callback)
                    setTimeout(callback, 1);
            }
        }
        performNextAction();
    };
    //////////////////////////////////////////////////////////////////////
    // The basic actions: left, right, pick, drop
    TextWorld.prototype.getAction = function (act) {
        var actions = { p: this.pick, d: this.drop, l: this.left, r: this.right };
        return actions[act.toLowerCase()];
    };
    TextWorld.prototype.left = function (callback) {
        if (this.currentState.arm <= 0) {
            throw "Already at left edge!";
        }
        this.currentState.arm--;
        callback();
    };
    TextWorld.prototype.right = function (callback) {
        if (this.currentState.arm >= this.currentState.stacks.length - 1) {
            throw "Already at right edge!";
        }
        this.currentState.arm++;
        callback();
    };
    TextWorld.prototype.pick = function (callback) {
        if (this.currentState.holding) {
            throw "Already holding something!";
        }
        var stack = this.currentState.arm;
        var pos = this.currentState.stacks[stack].length - 1;
        if (pos < 0) {
            throw "Stack is empty!";
        }
        this.currentState.holding = this.currentState.stacks[stack].pop();
        callback();
    };
    TextWorld.prototype.drop = function (callback) {
        if (!this.currentState.holding) {
            throw "Not holding anything!";
        }
        var stack = this.currentState.arm;
        this.currentState.stacks[stack].push(this.currentState.holding);
        this.currentState.holding = null;
        callback();
    };
    //////////////////////////////////////////////////////////////////////
    // Utilities
    TextWorld.prototype.centerString = function (str, width) {
        var padlen = width - str.length;
        if (padlen > 0) {
            str = Array(Math.floor((padlen + 3) / 2)).join(" ") + str + Array(Math.floor((padlen + 2) / 2)).join(" ");
        }
        return str;
    };
    return TextWorld;
}());
///<reference path="World.ts"/>
var ExampleWorlds = {};
ExampleWorlds["complex"] = {
    "stacks": [["e"], ["a", "l"], ["i", "h", "j"], ["c", "k", "g", "b"], ["d", "m", "f"]],
    "holding": null,
    "arm": 0,
    "objects": {
        "a": { "form": "brick", "size": "large", "color": "yellow" },
        "b": { "form": "brick", "size": "small", "color": "white" },
        "c": { "form": "plank", "size": "large", "color": "red" },
        "d": { "form": "plank", "size": "small", "color": "green" },
        "e": { "form": "ball", "size": "large", "color": "white" },
        "f": { "form": "ball", "size": "small", "color": "black" },
        "g": { "form": "table", "size": "large", "color": "blue" },
        "h": { "form": "table", "size": "small", "color": "red" },
        "i": { "form": "pyramid", "size": "large", "color": "yellow" },
        "j": { "form": "pyramid", "size": "small", "color": "red" },
        "k": { "form": "box", "size": "large", "color": "yellow" },
        "l": { "form": "box", "size": "large", "color": "red" },
        "m": { "form": "box", "size": "small", "color": "blue" }
    },
    "examples": [
        "put a box in a box",
        "put all balls on the floor",
        "take the yellow box",
        "put any object under all tables",
        "put any object under all tables on the floor",
        "put a ball in a small box in a large box",
        "put all balls in a large box",
        "put all balls left of a ball",
        "put all balls beside a ball",
        "put all balls beside every ball",
        "put a box beside all objects",
        "put all red objects above a yellow object on the floor",
        "put all yellow objects under a red object under an object"
    ]
};
ExampleWorlds["medium"] = {
    "stacks": [["e"], ["a", "l"], [], [], ["i", "h", "j"], [], [], ["k", "g", "c", "b"], [], ["d", "m", "f"]],
    "holding": null,
    "arm": 0,
    "objects": {
        "a": { "form": "brick", "size": "large", "color": "green" },
        "b": { "form": "brick", "size": "small", "color": "white" },
        "c": { "form": "plank", "size": "large", "color": "red" },
        "d": { "form": "plank", "size": "small", "color": "green" },
        "e": { "form": "ball", "size": "large", "color": "white" },
        "f": { "form": "ball", "size": "small", "color": "black" },
        "g": { "form": "table", "size": "large", "color": "blue" },
        "h": { "form": "table", "size": "small", "color": "red" },
        "i": { "form": "pyramid", "size": "large", "color": "yellow" },
        "j": { "form": "pyramid", "size": "small", "color": "red" },
        "k": { "form": "box", "size": "large", "color": "yellow" },
        "l": { "form": "box", "size": "large", "color": "red" },
        "m": { "form": "box", "size": "small", "color": "blue" }
    },
    "examples": [
        "put the brick that is to the left of a pyramid in a box",
        "put the white ball in a box on the floor",
        "move the large ball inside a yellow box on the floor",
        "move the large ball inside a red box on the floor",
        "take a red object",
        "take the white ball",
        "put all boxes on the floor",
        "put the large plank under the blue brick",
        "move all bricks on a table",
        "move all balls inside a large box"
    ]
};
ExampleWorlds["small"] = {
    "stacks": [["e"], ["g", "l"], [], ["k", "m", "f"], []],
    "holding": "a",
    "arm": 0,
    "objects": {
        "a": { "form": "brick", "size": "large", "color": "green" },
        "b": { "form": "brick", "size": "small", "color": "white" },
        "c": { "form": "plank", "size": "large", "color": "red" },
        "d": { "form": "plank", "size": "small", "color": "green" },
        "e": { "form": "ball", "size": "large", "color": "white" },
        "f": { "form": "ball", "size": "small", "color": "black" },
        "g": { "form": "table", "size": "large", "color": "blue" },
        "h": { "form": "table", "size": "small", "color": "red" },
        "i": { "form": "pyramid", "size": "large", "color": "yellow" },
        "j": { "form": "pyramid", "size": "small", "color": "red" },
        "k": { "form": "box", "size": "large", "color": "yellow" },
        "l": { "form": "box", "size": "large", "color": "red" },
        "m": { "form": "box", "size": "small", "color": "blue" }
    },
    "examples": [
        "put the white ball in a box on the floor",
        "put the black ball in a box on the floor",
        "take a blue object",
        "take the white ball",
        "put all boxes on the floor",
        "move all balls inside a large box"
    ]
};
ExampleWorlds["impossible"] = {
    "stacks": [["lbrick1", "lball1", "sbrick1"], [],
        ["lpyr1", "lbox1", "lplank2", "sball2"], [],
        ["sbrick2", "sbox1", "spyr1", "ltable1", "sball1"]],
    "holding": null,
    "arm": 0,
    "objects": {
        "lbrick1": { "form": "brick", "size": "large", "color": "green" },
        "sbrick1": { "form": "brick", "size": "small", "color": "yellow" },
        "sbrick2": { "form": "brick", "size": "small", "color": "blue" },
        "lplank1": { "form": "plank", "size": "large", "color": "red" },
        "lplank2": { "form": "plank", "size": "large", "color": "black" },
        "splank1": { "form": "plank", "size": "small", "color": "green" },
        "lball1": { "form": "ball", "size": "large", "color": "white" },
        "sball1": { "form": "ball", "size": "small", "color": "black" },
        "sball2": { "form": "ball", "size": "small", "color": "red" },
        "ltable1": { "form": "table", "size": "large", "color": "green" },
        "stable1": { "form": "table", "size": "small", "color": "red" },
        "lpyr1": { "form": "pyramid", "size": "large", "color": "white" },
        "spyr1": { "form": "pyramid", "size": "small", "color": "blue" },
        "lbox1": { "form": "box", "size": "large", "color": "yellow" },
        "sbox1": { "form": "box", "size": "small", "color": "red" },
        "sbox2": { "form": "box", "size": "small", "color": "blue" }
    },
    "examples": [
        "this is just an impossible world"
    ]
};
var allTestCases = [
    { world: "small",
        utterance: "take an object",
        interpretations: [["holding(e)", "holding(f)", "holding(g)", "holding(k)", "holding(l)", "holding(m)"]]
    },
    { world: "small",
        utterance: "take a blue object",
        interpretations: [["holding(g)", "holding(m)"]]
    },
    { world: "small",
        utterance: "take a box",
        interpretations: [["holding(k)", "holding(l)", "holding(m)"]]
    },
    { world: "small",
        utterance: "put a ball in a box",
        interpretations: [["inside(e,k)", "inside(e,l)", "inside(f,k)", "inside(f,l)", "inside(f,m)"]]
    },
    { world: "small",
        utterance: "put a ball on a table",
        interpretations: []
    },
    { world: "small",
        utterance: "put a ball above a table",
        interpretations: [["above(e,g)", "above(f,g)"]]
    },
    { world: "small",
        utterance: "put a big ball in a small box",
        interpretations: []
    },
    { world: "small",
        utterance: "put a ball left of a ball",
        interpretations: [["leftof(e,f)", "leftof(f,e)"]]
    },
    { world: "small",
        utterance: "take a white object beside a blue object",
        interpretations: [["holding(e)"]]
    },
    { world: "small",
        utterance: "put a white object beside a blue object",
        interpretations: [["beside(e,g) | beside(e,m)"]]
    },
    { world: "small",
        utterance: "put a ball in a box on the floor",
        interpretations: [["inside(e,k)", "inside(f,k)"], ["ontop(f,floor)"]]
    },
    { world: "small",
        utterance: "put a white ball in a box on the floor",
        interpretations: [["inside(e,k)"]]
    },
    { world: "small",
        utterance: "put a black ball in a box on the floor",
        interpretations: [["inside(f,k)"], ["ontop(f,floor)"]]
    }
];
// /* Simple test cases for the ALL quantifier, uncomment if you want */
// allTestCases.push(
//     {world: "small",
//      utterance: "put all balls on the floor",
//      interpretations: [["ontop(e,floor) & ontop(f,floor)"]]
//     },
//     {world: "small",
//      utterance: "put every ball to the right of all blue things",
//      interpretations: [["rightof(e,g) & rightof(e,m) & rightof(f,g) & rightof(f,m)"]]
//     },
//     {world: "small",
//      utterance: "put all balls left of a box on the floor",
//      interpretations: [["leftof(e,k) & leftof(f,k)"], ["ontop(e,floor)"]]
//     }
// );
// /* More dubious examples for the ALL quantifier */
// /* (i.e., it's not clear that these interpretations are the best) */
// allTestCases.push(
//     {world: "small",
//      utterance: "put a ball in every large box",
//      interpretations: [["inside(e,k) & inside(f,k)", "inside(e,l) & inside(f,k)",
//                         "inside(e,k) & inside(f,l)", "inside(e,l) & inside(f,l)"]]
//     },
//     {world: "small",
//      utterance: "put every ball in a box",
//      interpretations: [["inside(e,k) & inside(f,k)", "inside(e,l) & inside(f,k)",
//                         "inside(e,k) & inside(f,l)", "inside(e,l) & inside(f,l)",
//                         "inside(e,k) & inside(f,m)", "inside(e,l) & inside(f,m)"]]
//     }
// );
///<reference path="Shrdlite.ts"/>
///<reference path="TextWorld.ts"/>
///<reference path="ExampleWorlds.ts"/>
///<reference path="InterpreterTestCases.ts"/>
function testInterpreter(testcase) {
    var world = new TextWorld(ExampleWorlds[testcase.world]);
    var utterance = testcase.utterance;
    console.log('Testing utterance: "' + utterance + '", in world "' + testcase.world + '"');
    try {
        var parses = Parser.parse(utterance);
        console.log("Found " + parses.length + " parses");
    }
    catch (err) {
        console.log("ERROR: Parsing error!", err);
        return false;
    }
    var correctints = testcase.interpretations.map(function (intp) { return intp.sort().join(" | "); }).sort();
    try {
        var interpretations = Interpreter.interpret(parses, world.currentState).map(function (intp) {
            return intp.interpretation.map(function (literals) { return literals.map(Interpreter.stringifyLiteral).sort().join(" & "); }).sort().join(" | ");
        }).sort();
    }
    catch (err) {
        interpretations = [];
    }
    console.log("Correct interpretations:");
    var n = 0;
    interpretations.forEach(function (intp) {
        if (correctints.some(function (i) { return i == intp; })) {
            n++;
            console.log("    (" + n + ") " + intp);
        }
    });
    if (n == correctints.length && n == interpretations.length) {
        if (n == 0) {
            console.log("    There are no interpretations!");
        }
        console.log("Everything is correct!");
        return true;
    }
    if (n == 0) {
        console.log("    No correct interpretations!");
    }
    ;
    if (n < correctints.length) {
        console.log("Missing interpretations:");
        correctints.forEach(function (intp) {
            if (!interpretations.some(function (j) { return j == intp; })) {
                console.log("    (-) " + intp);
            }
        });
    }
    if (n < interpretations.length) {
        console.log("Incorrect interpretations:");
        interpretations.forEach(function (intp) {
            if (!correctints.some(function (i) { return i == intp; })) {
                n++;
                console.log("    (" + n + ") " + intp);
            }
        });
    }
    return false;
}
function runTests(argv) {
    var testcases = [];
    if (argv.length == 0 || argv[0] == "all") {
        testcases = allTestCases;
    }
    else {
        for (var _i = 0, argv_1 = argv; _i < argv_1.length; _i++) {
            var n = argv_1[_i];
            testcases.push(allTestCases[parseInt(n) - 1]);
        }
    }
    var failed = 0;
    for (var i = 0; i < testcases.length; i++) {
        console.log("--------------------------------------------------------------------------------");
        var ok = testInterpreter(testcases[i]);
        if (!ok)
            failed++;
        console.log();
    }
    console.log("--------------------------------------------------------------------------------");
    console.log("Summary statistics");
    console.log("Passed tests: " + (testcases.length - failed));
    console.log("Failed tests: " + failed);
    console.log();
}
try {
    runTests(process.argv.slice(2));
}
catch (err) {
    console.log("ERROR: " + err);
    console.log();
    console.log("Please give at least one argument:");
    console.log("- either a number (1.." + allTestCases.length + ") for each test you want to run,");
    console.log("- or 'all' for running all tests.");
}
