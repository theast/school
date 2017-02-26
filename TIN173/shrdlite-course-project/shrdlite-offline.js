var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
     * The core interpretation function.
     * @param cmd The actual command. Note that it is *not* a string, but rather an object of type `Command` (as it has been parsed by the parser).
     * @param state The current state of the world. Useful to look up objects in the world.
     * @returns A list of list of Literal, representing a formula in disjunctive normal form (disjunction of conjunctions). See the dummy interpetation returned in the code for an example, which means ontop(a,floor) AND holding(b).
     */
    function interpretCommand(cmd, state) {
        if (cmd.command === "move" || cmd.command === "take") {
            // special checks that only is meaningful on the subject of the command
            var srcQuantifier = cmd.entity.quantifier;
            var srcObj = cmd.entity.object.location === undefined ? cmd.entity.object : cmd.entity.object.object;
            if (srcObj.form === "floor")
                throw "'" + cmd.command + " the floor' does not make sense";
        }
        if (cmd.command === "move") {
            var relation = cmd.location.relation;
            var dstQuantifier = cmd.location.entity.quantifier;
            var dstObj = cmd.location.entity.object.location === undefined ? cmd.location.entity.object : cmd.location.entity.object.object;
            checkRelationInUtterence(srcQuantifier, srcObj, relation, dstQuantifier, dstObj);
        }
        // Top level utterence seems ok, lets go recursive
        var subjects;
        if (cmd.command === "put") {
            // we want manipulate the object in the arm
            if (state.holding === null)
                throw "we aren't holding anything";
            // this will break, eventually
            subjects = [[{ objId: state.holding }]];
        }
        else {
            // figure out what objects we want to manipulate
            subjects = findEntities(cmd.entity, state);
        }
        var ors = [];
        if (cmd.command === "take") {
            // the object should end up in our arm
            if (cmd.entity.quantifier === "all")
                throw "we can't pick up more than one object";
            for (var _i = 0, subjects_1 = subjects; _i < subjects_1.length; _i++) {
                var subs = subjects_1[_i];
                ors.push([{ polarity: true, relation: "holding", args: [subs[0].objId] }]);
            }
        }
        else {
            //TODO implement CNF <-> DNF
            var destss = findEntities(cmd.location.entity, state);
            for (var _a = 0, subjects_2 = subjects; _a < subjects_2.length; _a++) {
                var subs = subjects_2[_a];
                if (!subs.length)
                    continue;
                // temporary fix for CNF <-> DNF is to use two different combinators
                // this means that it will not properly handle "put all balls beside all boxes"
                // that utterence will be interpreted as "put all balls beside any box"
                if (subs.length > 1)
                    ors = ors.concat(combineAllToOne(cmd.location.relation, subs, destss.map(function (x) { return x[0]; }), state));
                else
                    ors = ors.concat(combineOneToAll(cmd.location.relation, subs[0], destss, state));
            }
        }
        if (!ors.length)
            throw "unable to interpret";
        return ors;
    }
    /**
     * combineOneToAll function
     * Combines the quantifiers "any/the" with "all"
     * @param relation The relation that the entities should share.
     * @param left
     * @param rightss
     * @param state The WorldState
     * @returns A DNFFormula
     */
    function combineOneToAll(relation, left, rightss, state) {
        var ors = [];
        var src_objId = left.objId;
        var src_obj = state.objects[src_objId];
        for (var _i = 0, rightss_1 = rightss; _i < rightss_1.length; _i++) {
            var rights = rightss_1[_i];
            var ands = [];
            for (var _a = 0, rights_1 = rights; _a < rights_1.length; _a++) {
                var right = rights_1[_a];
                var dest_objId = right.objId;
                var dest_obj = state.objects[dest_objId];
                if (checkPhysics(src_objId, src_obj, relation, dest_objId, dest_obj))
                    ands.push({ polarity: true, relation: relation, args: [src_objId, dest_objId] });
            }
            if (ands.length)
                ors.push(ands);
        }
        return ors;
    }
    /**
     * combineAllToOne function
     * Combines the quantifier "all" with "any/the".
     * @param relation The relations that the entities should share.
     * @param lefts A DNFFormula of the first arguments in the relation.
     * @param rights
     * @param state The WorldState
     * @returns A DNFFormula
     */
    function combineAllToOne(relation, lefts, rights, state) {
        var ors = [];
        if (lefts.length === 1) {
            var src_objId = lefts[0].objId;
            var src_obj = state.objects[src_objId];
            for (var _i = 0, rights_2 = rights; _i < rights_2.length; _i++) {
                var right = rights_2[_i];
                var dst_objId = right.objId;
                var dst_obj = state.objects[dst_objId];
                if (checkPhysics(src_objId, src_obj, relation, dst_objId, dst_obj))
                    ors.push([{ polarity: true, relation: relation, args: [src_objId, dst_objId] }]);
            }
        }
        else if (rights.length === 1) {
            var and = [];
            var dst_objId = rights[0].objId;
            var dst_obj = state.objects[dst_objId];
            for (var _a = 0, lefts_1 = lefts; _a < lefts_1.length; _a++) {
                var left = lefts_1[_a];
                var src_objId = left.objId;
                var src_obj = state.objects[src_objId];
                if (checkPhysics(src_objId, src_obj, relation, dst_objId, dst_obj))
                    and.push({ polarity: true, relation: relation, args: [src_objId, dst_objId] });
            }
            if (and.length)
                ors.push(and);
        }
        else {
            var left = lefts.pop();
            for (var i = rights.length - 1; i >= 0; i--) {
                var l = lefts.slice();
                var r = rights.slice();
                var right = r.splice(i, 1)[0];
                var dnf = combineAllToOne(relation, l, r, state);
                if (checkPhysics(left.objId, state.objects[left.objId], relation, right.objId, state.objects[right.objId]))
                    for (var _b = 0, dnf_1 = dnf; _b < dnf_1.length; _b++) {
                        var or = dnf_1[_b];
                        or.push({ polarity: true, relation: relation, args: [left.objId, right.objId] });
                    }
                ors = ors.concat(dnf);
            }
        }
        return ors;
    }
    function checkPhysics(srcId, srcObj, relation, dstId, dstObj) {
        if (srcId === dstId)
            return false;
        if (dstObj === undefined)
            return true;
        if (srcObj.form === "floor")
            return false;
        switch (relation) {
            case "inside":
                //Objects are “inside” boxes, but “ontop” of other objects.
                if (dstObj.form !== "box")
                    return false;
                //Small objects cannot support large objects.
                if (srcObj.size === "large" && dstObj.size === "small")
                    return false;
                //Boxes cannot contain pyramids, planks or boxes of the same size
                if ((srcObj.form === "pyramid" || srcObj.form === "plank" || srcObj.form === "box") && dstObj.form === "box" && srcObj.size === dstObj.size)
                    return false;
                break;
            case "ontop":
                //Objects are “inside” boxes, but “ontop” of other objects.
                if (dstObj.form === "box")
                    return false;
                //Can't have anything ontop of a ball
                if (dstObj.form === "ball")
                    return false;
                //Small objects cannot support large objects.
                if (srcObj.size === "large" && dstObj.size === "small")
                    return false;
                //Balls must be in boxes or on the floor, otherwise they roll away.
                if (srcObj.form === "ball" && dstObj.form !== "floor")
                    return false;
                //Small boxes cannot be supported by small bricks or pyramids.
                if (srcObj.size === "small" && srcObj.form === "box" && dstObj.size === "small" && (dstObj.form === "pyramid" || dstObj.form === "plank"))
                    return false;
                //Large boxes cannot be supported by large pyramids.
                if (srcObj.size === "large" && srcObj.form === "box" && dstObj.size === "large" && dstObj.form === "pyramid")
                    return false;
                break;
            case "under":
                //Can't have anything under the floor 
                if (dstObj.form === "floor")
                    return false;
                //Can't have a small object under a large object
                if (dstObj.size === "large" && srcObj.size === "small")
                    return false;
                //Balls must have floor or box under itself
                if (dstObj.form === "ball" && srcObj.form !== "floor" && srcObj.form !== "box")
                    return false;
                break;
            case "beside":
                // Object cant be beside floor
                if (dstObj.form === "floor")
                    return false;
                break;
        }
        return true;
    }
    Interpreter.checkPhysics = checkPhysics;
    /**
     * findEntities function
     * Finds all entities that matches the description of the given entity.
     * @param entity The description of the entity to find.
     * @param state Tbe WorldState.
     * @returns returns all entites that matches the description.
     */
    function findEntities(entity, state) {
        if (entity.object.location !== undefined) {
            // there are more restrictions
            var orTests = findLocations(entity.quantifier, entity.object.object, entity.object.location, state);
            var objs = findObjects(entity.object.object, state);
            var validObjs = objs.filter(function (obj) { return orTests.some(function (ands) { return ands.every(function (test) { return test.test(obj); }); }); });
            return checkQuantifier(entity.quantifier, validObjs);
        }
        else {
            // entity.object describes what entities we want to find
            var objs = findObjects(entity.object, state);
            return checkQuantifier(entity.quantifier, objs);
        }
    }
    /**
     * checkQuantifier function
     * Checks if the quantifier can be used with the entities.
     * @param quantifier The quantifier
     * @param entities The entities to be DNF'ed.
     * @returns DNF according to quantifier.
     */
    function checkQuantifier(quantifier, entities) {
        switch (quantifier) {
            case "the":
                if (entities.length > 1)
                    throw "\"the\" is ambigous";
                return [entities];
            case "any":
                return entities.map(function (x) { return [x]; });
            case "all":
                return [entities];
        }
        throw "unknown quantifier \"" + quantifier + "\"";
    }
    /**
     * findObjects function
     * Finds objects that matches a description.
     * @param objectDesc The description of the object that we want to find.
     * @param state The WorldState
     * @returns A list of objects found.
     */
    function findObjects(objectDesc, state) {
        var entities = [];
        if (objectDesc.form === "floor") {
            // so for some reason the parser thinks that "small blue floor" is an ok utterance
            // that's all good, except that the floor can't have a size or color...
            if (objectDesc.size !== null || objectDesc.color !== null) {
                throw ("the floor can't have a size or color");
            }
            entities.push({ objId: "floor" });
            return entities;
        }
        for (var stackIndex = 0; stackIndex < state.stacks.length; stackIndex++) {
            var stack = state.stacks[stackIndex];
            for (var objIndex = 0; objIndex < stack.length; objIndex++) {
                var objId = stack[objIndex];
                var object = state.objects[objId];
                var form = objectDesc.form === null || objectDesc.form === "anyform" || objectDesc.form === object.form;
                var size = objectDesc.size === null || objectDesc.size === object.size;
                var color = objectDesc.color === null || objectDesc.color === object.color;
                if (form && size && color) {
                    entities.push({ objId: objId, stack: stackIndex, posInStack: objIndex });
                }
            }
        }
        return entities;
    }
    /**
     * checkRelationInUtterence function
     * Checks if the utterence is valid, throws if it is not.
     * @param srcQuantifier The quantifier of the source.
     * @param srcObj The source object.
     * @param relation The relation.
     * @param dstQuantifier The destination quantifier.
     * @param dstObj The destination object.
     */
    function checkRelationInUtterence(srcQuantifier, srcObj, relation, dstQuantifier, dstObj) {
        // floor is special
        if (dstObj.form === "floor") {
            if (relation !== "above" && relation !== "ontop")
                throw ("'" + relation + " floor' does not make sense");
        }
        // check for relation/form
        switch (relation) {
            case "inside":
                if (dstObj.form !== "box")
                    throw ("\"inside " + dstObj.form + "\" does not make sense");
                break;
            case "ontop":
                if (dstObj.form === "ball")
                    throw ("you can not put objects on balls"); // Balls cannot support anything.
                break;
        }
        // check for relation/quantity
        switch (relation) {
            case "inside":
            case "ontop":
                switch (srcQuantifier) {
                    case "the":
                    case "any":
                        if (dstQuantifier === "all")
                            throw ("\"" + srcQuantifier + " ... " + relation + " all\" doesn't make sense");
                        break;
                    case "all":
                        if (dstQuantifier === "the" && dstObj.form !== "floor")
                            throw ("\"all ... " + relation + " the\" doesn't make sense");
                        break;
                }
                break;
        }
    }
    /**
     * findLocations function
     * Find all entities in a location and create a ObjectPositionTestDNF for it.
     * @param srcQuantifier Used with checkRelationInUtterence
     * @param srcObj Used with checkRelationInUtterence
     * @param location The location decription
     * @param state The WorldState
     * @returns A ObjectPositionTestDNF
     */
    function findLocations(srcQuantifier, srcObj, location, state) {
        var dstQuantifier = location.entity.quantifier;
        var dstObj;
        if (location.entity.object.location === undefined)
            dstObj = location.entity.object;
        else
            dstObj = location.entity.object.object;
        checkRelationInUtterence(srcQuantifier, srcObj, location.relation, dstQuantifier, dstObj);
        var testFun;
        switch (location.relation) {
            case "leftof":
                testFun = leftof;
                break;
            case "rightof":
                testFun = rightof;
                break;
            case "inside":
            case "ontop":
                testFun = ontop;
                break;
            case "under":
                testFun = under;
                break;
            case "beside":
                testFun = beside;
                break;
            case "above":
                testFun = above;
                break;
        }
        var refss = findEntities(location.entity, state);
        var refTestss = [];
        for (var _i = 0, refss_1 = refss; _i < refss_1.length; _i++) {
            var refs = refss_1[_i];
            var refTests = [];
            for (var _a = 0, refs_1 = refs; _a < refs_1.length; _a++) {
                var ref = refs_1[_a];
                refTests.push(new ObjectPositionTest(ref, testFun));
            }
            refTestss.push(refTests);
        }
        return refTestss;
    }
    /**
     * ObjectPositionTest class
     * A test that is relative a given object.
     */
    var ObjectPositionTest = (function () {
        function ObjectPositionTest(refPos, testFun) {
            this.refPos = refPos;
            this.testFun = testFun;
        }
        ObjectPositionTest.prototype.test = function (x) {
            return this.testFun(x, this.refPos);
        };
        return ObjectPositionTest;
    }());
    // these functions are used with ObjectPositionTest
    function leftof(x, refPos) {
        if (refPos.stack === undefined) {
            throw ("left of \"" + refPos.objId + "\" doesn't make sense");
        }
        else {
            return x.stack < refPos.stack;
        }
    }
    function rightof(x, refPos) {
        if (refPos.stack === undefined) {
            throw ("right of \"" + refPos.objId + "\" doesn't make sense");
        }
        else {
            return x.stack > refPos.stack;
        }
    }
    function ontop(x, refPos) {
        if (refPos.stack === undefined) {
            switch (refPos.objId) {
                case "floor":
                    return x.posInStack === 0;
            }
            throw ("on top \"" + refPos.objId + "\" doesn't make sense");
        }
        else {
            return x.stack === refPos.stack && x.posInStack === refPos.posInStack + 1;
        }
    }
    function under(x, refPos) {
        if (refPos.stack === undefined) {
            throw ("under \"" + refPos.objId + "\" doesn't make sense");
        }
        else {
            return x.stack === refPos.stack && x.posInStack < refPos.posInStack;
        }
    }
    function beside(x, refPos) {
        if (refPos.stack === undefined) {
            throw ("beside \"" + refPos.objId + "\" doesn't make sense");
        }
        else {
            return Math.abs(x.stack - refPos.stack) === 1;
        }
    }
    function above(x, refPos) {
        if (refPos.stack === undefined) {
            throw ("above \"" + refPos.objId + "\" doesn't make sense");
        }
        else {
            return x.stack === refPos.stack && x.posInStack > refPos.posInStack;
        }
    }
})(Interpreter || (Interpreter = {}));
// Copyright 2013 Basarat Ali Syed. All Rights Reserved.
//
// Licensed under MIT open source license http://opensource.org/licenses/MIT
//
// Orginal javascript code was by Mauricio Santos
/**
 * @namespace Top level namespace for collections, a TypeScript data structure library.
 */
var collections;
(function (collections) {
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var has = function (obj, prop) {
        return _hasOwnProperty.call(obj, prop);
    };
    /**
     * Default function to compare element order.
     * @function
     */
    function defaultCompare(a, b) {
        if (a < b) {
            return -1;
        }
        else if (a === b) {
            return 0;
        }
        else {
            return 1;
        }
    }
    collections.defaultCompare = defaultCompare;
    /**
     * Default function to test equality.
     * @function
     */
    function defaultEquals(a, b) {
        return a === b;
    }
    collections.defaultEquals = defaultEquals;
    /**
     * Default function to convert an object to a string.
     * @function
     */
    function defaultToString(item) {
        if (item === null) {
            return 'COLLECTION_NULL';
        }
        else if (collections.isUndefined(item)) {
            return 'COLLECTION_UNDEFINED';
        }
        else if (collections.isString(item)) {
            return '$s' + item;
        }
        else {
            return '$o' + item.toString();
        }
    }
    collections.defaultToString = defaultToString;
    /**
    * Joins all the properies of the object using the provided join string
    */
    function makeString(item, join) {
        if (join === void 0) { join = ","; }
        if (item === null) {
            return 'COLLECTION_NULL';
        }
        else if (collections.isUndefined(item)) {
            return 'COLLECTION_UNDEFINED';
        }
        else if (collections.isString(item)) {
            return item.toString();
        }
        else {
            var toret = "{";
            var first = true;
            for (var prop in item) {
                if (has(item, prop)) {
                    if (first)
                        first = false;
                    else
                        toret = toret + join;
                    toret = toret + prop + ":" + item[prop];
                }
            }
            return toret + "}";
        }
    }
    collections.makeString = makeString;
    /**
     * Checks if the given argument is a function.
     * @function
     */
    function isFunction(func) {
        return (typeof func) === 'function';
    }
    collections.isFunction = isFunction;
    /**
     * Checks if the given argument is undefined.
     * @function
     */
    function isUndefined(obj) {
        return (typeof obj) === 'undefined';
    }
    collections.isUndefined = isUndefined;
    /**
     * Checks if the given argument is a string.
     * @function
     */
    function isString(obj) {
        return Object.prototype.toString.call(obj) === '[object String]';
    }
    collections.isString = isString;
    /**
     * Reverses a compare function.
     * @function
     */
    function reverseCompareFunction(compareFunction) {
        if (!collections.isFunction(compareFunction)) {
            return function (a, b) {
                if (a < b) {
                    return 1;
                }
                else if (a === b) {
                    return 0;
                }
                else {
                    return -1;
                }
            };
        }
        else {
            return function (d, v) {
                return compareFunction(d, v) * -1;
            };
        }
    }
    collections.reverseCompareFunction = reverseCompareFunction;
    /**
     * Returns an equal function given a compare function.
     * @function
     */
    function compareToEquals(compareFunction) {
        return function (a, b) {
            return compareFunction(a, b) === 0;
        };
    }
    collections.compareToEquals = compareToEquals;
    /**
     * @namespace Contains various functions for manipulating arrays.
     */
    var arrays;
    (function (arrays) {
        /**
         * Returns the position of the first occurrence of the specified item
         * within the specified array.
         * @param {*} array the array in which to search the element.
         * @param {Object} item the element to search.
         * @param {function(Object,Object):boolean=} equalsFunction optional function used to
         * check equality between 2 elements.
         * @return {number} the position of the first occurrence of the specified element
         * within the specified array, or -1 if not found.
         */
        function indexOf(array, item, equalsFunction) {
            var equals = equalsFunction || collections.defaultEquals;
            var length = array.length;
            for (var i = 0; i < length; i++) {
                if (equals(array[i], item)) {
                    return i;
                }
            }
            return -1;
        }
        arrays.indexOf = indexOf;
        /**
         * Returns the position of the last occurrence of the specified element
         * within the specified array.
         * @param {*} array the array in which to search the element.
         * @param {Object} item the element to search.
         * @param {function(Object,Object):boolean=} equalsFunction optional function used to
         * check equality between 2 elements.
         * @return {number} the position of the last occurrence of the specified element
         * within the specified array or -1 if not found.
         */
        function lastIndexOf(array, item, equalsFunction) {
            var equals = equalsFunction || collections.defaultEquals;
            var length = array.length;
            for (var i = length - 1; i >= 0; i--) {
                if (equals(array[i], item)) {
                    return i;
                }
            }
            return -1;
        }
        arrays.lastIndexOf = lastIndexOf;
        /**
         * Returns true if the specified array contains the specified element.
         * @param {*} array the array in which to search the element.
         * @param {Object} item the element to search.
         * @param {function(Object,Object):boolean=} equalsFunction optional function to
         * check equality between 2 elements.
         * @return {boolean} true if the specified array contains the specified element.
         */
        function contains(array, item, equalsFunction) {
            return arrays.indexOf(array, item, equalsFunction) >= 0;
        }
        arrays.contains = contains;
        /**
         * Removes the first ocurrence of the specified element from the specified array.
         * @param {*} array the array in which to search element.
         * @param {Object} item the element to search.
         * @param {function(Object,Object):boolean=} equalsFunction optional function to
         * check equality between 2 elements.
         * @return {boolean} true if the array changed after this call.
         */
        function remove(array, item, equalsFunction) {
            var index = arrays.indexOf(array, item, equalsFunction);
            if (index < 0) {
                return false;
            }
            array.splice(index, 1);
            return true;
        }
        arrays.remove = remove;
        /**
         * Returns the number of elements in the specified array equal
         * to the specified object.
         * @param {Array} array the array in which to determine the frequency of the element.
         * @param {Object} item the element whose frequency is to be determined.
         * @param {function(Object,Object):boolean=} equalsFunction optional function used to
         * check equality between 2 elements.
         * @return {number} the number of elements in the specified array
         * equal to the specified object.
         */
        function frequency(array, item, equalsFunction) {
            var equals = equalsFunction || collections.defaultEquals;
            var length = array.length;
            var freq = 0;
            for (var i = 0; i < length; i++) {
                if (equals(array[i], item)) {
                    freq++;
                }
            }
            return freq;
        }
        arrays.frequency = frequency;
        /**
         * Returns true if the two specified arrays are equal to one another.
         * Two arrays are considered equal if both arrays contain the same number
         * of elements, and all corresponding pairs of elements in the two
         * arrays are equal and are in the same order.
         * @param {Array} array1 one array to be tested for equality.
         * @param {Array} array2 the other array to be tested for equality.
         * @param {function(Object,Object):boolean=} equalsFunction optional function used to
         * check equality between elemements in the arrays.
         * @return {boolean} true if the two arrays are equal
         */
        function equals(array1, array2, equalsFunction) {
            var equals = equalsFunction || collections.defaultEquals;
            if (array1.length !== array2.length) {
                return false;
            }
            var length = array1.length;
            for (var i = 0; i < length; i++) {
                if (!equals(array1[i], array2[i])) {
                    return false;
                }
            }
            return true;
        }
        arrays.equals = equals;
        /**
         * Returns shallow a copy of the specified array.
         * @param {*} array the array to copy.
         * @return {Array} a copy of the specified array
         */
        function copy(array) {
            return array.concat();
        }
        arrays.copy = copy;
        /**
         * Swaps the elements at the specified positions in the specified array.
         * @param {Array} array The array in which to swap elements.
         * @param {number} i the index of one element to be swapped.
         * @param {number} j the index of the other element to be swapped.
         * @return {boolean} true if the array is defined and the indexes are valid.
         */
        function swap(array, i, j) {
            if (i < 0 || i >= array.length || j < 0 || j >= array.length) {
                return false;
            }
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
            return true;
        }
        arrays.swap = swap;
        function toString(array) {
            return '[' + array.toString() + ']';
        }
        arrays.toString = toString;
        /**
         * Executes the provided function once for each element present in this array
         * starting from index 0 to length - 1.
         * @param {Array} array The array in which to iterate.
         * @param {function(Object):*} callback function to execute, it is
         * invoked with one argument: the element value, to break the iteration you can
         * optionally return false.
         */
        function forEach(array, callback) {
            var lenght = array.length;
            for (var i = 0; i < lenght; i++) {
                if (callback(array[i]) === false) {
                    return;
                }
            }
        }
        arrays.forEach = forEach;
    })(arrays = collections.arrays || (collections.arrays = {}));
    var LinkedList = (function () {
        /**
        * Creates an empty Linked List.
        * @class A linked list is a data structure consisting of a group of nodes
        * which together represent a sequence.
        * @constructor
        */
        function LinkedList() {
            /**
            * First node in the list
            * @type {Object}
            * @private
            */
            this.firstNode = null;
            /**
            * Last node in the list
            * @type {Object}
            * @private
            */
            this.lastNode = null;
            /**
            * Number of elements in the list
            * @type {number}
            * @private
            */
            this.nElements = 0;
        }
        /**
        * Adds an element to this list.
        * @param {Object} item element to be added.
        * @param {number=} index optional index to add the element. If no index is specified
        * the element is added to the end of this list.
        * @return {boolean} true if the element was added or false if the index is invalid
        * or if the element is undefined.
        */
        LinkedList.prototype.add = function (item, index) {
            if (collections.isUndefined(index)) {
                index = this.nElements;
            }
            if (index < 0 || index > this.nElements || collections.isUndefined(item)) {
                return false;
            }
            var newNode = this.createNode(item);
            if (this.nElements === 0) {
                // First node in the list.
                this.firstNode = newNode;
                this.lastNode = newNode;
            }
            else if (index === this.nElements) {
                // Insert at the end.
                this.lastNode.next = newNode;
                this.lastNode = newNode;
            }
            else if (index === 0) {
                // Change first node.
                newNode.next = this.firstNode;
                this.firstNode = newNode;
            }
            else {
                var prev = this.nodeAtIndex(index - 1);
                newNode.next = prev.next;
                prev.next = newNode;
            }
            this.nElements++;
            return true;
        };
        /**
        * Returns the first element in this list.
        * @return {*} the first element of the list or undefined if the list is
        * empty.
        */
        LinkedList.prototype.first = function () {
            if (this.firstNode !== null) {
                return this.firstNode.element;
            }
            return undefined;
        };
        /**
        * Returns the last element in this list.
        * @return {*} the last element in the list or undefined if the list is
        * empty.
        */
        LinkedList.prototype.last = function () {
            if (this.lastNode !== null) {
                return this.lastNode.element;
            }
            return undefined;
        };
        /**
         * Returns the element at the specified position in this list.
         * @param {number} index desired index.
         * @return {*} the element at the given index or undefined if the index is
         * out of bounds.
         */
        LinkedList.prototype.elementAtIndex = function (index) {
            var node = this.nodeAtIndex(index);
            if (node === null) {
                return undefined;
            }
            return node.element;
        };
        /**
         * Returns the index in this list of the first occurrence of the
         * specified element, or -1 if the List does not contain this element.
         * <p>If the elements inside this list are
         * not comparable with the === operator a custom equals function should be
         * provided to perform searches, the function must receive two arguments and
         * return true if they are equal, false otherwise. Example:</p>
         *
         * <pre>
         * var petsAreEqualByName = function(pet1, pet2) {
         *  return pet1.name === pet2.name;
         * }
         * </pre>
         * @param {Object} item element to search for.
         * @param {function(Object,Object):boolean=} equalsFunction Optional
         * function used to check if two elements are equal.
         * @return {number} the index in this list of the first occurrence
         * of the specified element, or -1 if this list does not contain the
         * element.
         */
        LinkedList.prototype.indexOf = function (item, equalsFunction) {
            var equalsF = equalsFunction || collections.defaultEquals;
            if (collections.isUndefined(item)) {
                return -1;
            }
            var currentNode = this.firstNode;
            var index = 0;
            while (currentNode !== null) {
                if (equalsF(currentNode.element, item)) {
                    return index;
                }
                index++;
                currentNode = currentNode.next;
            }
            return -1;
        };
        /**
           * Returns true if this list contains the specified element.
           * <p>If the elements inside the list are
           * not comparable with the === operator a custom equals function should be
           * provided to perform searches, the function must receive two arguments and
           * return true if they are equal, false otherwise. Example:</p>
           *
           * <pre>
           * var petsAreEqualByName = function(pet1, pet2) {
           *  return pet1.name === pet2.name;
           * }
           * </pre>
           * @param {Object} item element to search for.
           * @param {function(Object,Object):boolean=} equalsFunction Optional
           * function used to check if two elements are equal.
           * @return {boolean} true if this list contains the specified element, false
           * otherwise.
           */
        LinkedList.prototype.contains = function (item, equalsFunction) {
            return (this.indexOf(item, equalsFunction) >= 0);
        };
        /**
         * Removes the first occurrence of the specified element in this list.
         * <p>If the elements inside the list are
         * not comparable with the === operator a custom equals function should be
         * provided to perform searches, the function must receive two arguments and
         * return true if they are equal, false otherwise. Example:</p>
         *
         * <pre>
         * var petsAreEqualByName = function(pet1, pet2) {
         *  return pet1.name === pet2.name;
         * }
         * </pre>
         * @param {Object} item element to be removed from this list, if present.
         * @return {boolean} true if the list contained the specified element.
         */
        LinkedList.prototype.remove = function (item, equalsFunction) {
            var equalsF = equalsFunction || collections.defaultEquals;
            if (this.nElements < 1 || collections.isUndefined(item)) {
                return false;
            }
            var previous = null;
            var currentNode = this.firstNode;
            while (currentNode !== null) {
                if (equalsF(currentNode.element, item)) {
                    if (currentNode === this.firstNode) {
                        this.firstNode = this.firstNode.next;
                        if (currentNode === this.lastNode) {
                            this.lastNode = null;
                        }
                    }
                    else if (currentNode === this.lastNode) {
                        this.lastNode = previous;
                        previous.next = currentNode.next;
                        currentNode.next = null;
                    }
                    else {
                        previous.next = currentNode.next;
                        currentNode.next = null;
                    }
                    this.nElements--;
                    return true;
                }
                previous = currentNode;
                currentNode = currentNode.next;
            }
            return false;
        };
        /**
         * Removes all of the elements from this list.
         */
        LinkedList.prototype.clear = function () {
            this.firstNode = null;
            this.lastNode = null;
            this.nElements = 0;
        };
        /**
         * Returns true if this list is equal to the given list.
         * Two lists are equal if they have the same elements in the same order.
         * @param {LinkedList} other the other list.
         * @param {function(Object,Object):boolean=} equalsFunction optional
         * function used to check if two elements are equal. If the elements in the lists
         * are custom objects you should provide a function, otherwise
         * the === operator is used to check equality between elements.
         * @return {boolean} true if this list is equal to the given list.
         */
        LinkedList.prototype.equals = function (other, equalsFunction) {
            var eqF = equalsFunction || collections.defaultEquals;
            if (!(other instanceof collections.LinkedList)) {
                return false;
            }
            if (this.size() !== other.size()) {
                return false;
            }
            return this.equalsAux(this.firstNode, other.firstNode, eqF);
        };
        /**
        * @private
        */
        LinkedList.prototype.equalsAux = function (n1, n2, eqF) {
            while (n1 !== null) {
                if (!eqF(n1.element, n2.element)) {
                    return false;
                }
                n1 = n1.next;
                n2 = n2.next;
            }
            return true;
        };
        /**
         * Removes the element at the specified position in this list.
         * @param {number} index given index.
         * @return {*} removed element or undefined if the index is out of bounds.
         */
        LinkedList.prototype.removeElementAtIndex = function (index) {
            if (index < 0 || index >= this.nElements) {
                return undefined;
            }
            var element;
            if (this.nElements === 1) {
                //First node in the list.
                element = this.firstNode.element;
                this.firstNode = null;
                this.lastNode = null;
            }
            else {
                var previous = this.nodeAtIndex(index - 1);
                if (previous === null) {
                    element = this.firstNode.element;
                    this.firstNode = this.firstNode.next;
                }
                else if (previous.next === this.lastNode) {
                    element = this.lastNode.element;
                    this.lastNode = previous;
                }
                if (previous !== null) {
                    element = previous.next.element;
                    previous.next = previous.next.next;
                }
            }
            this.nElements--;
            return element;
        };
        /**
         * Executes the provided function once for each element present in this list in order.
         * @param {function(Object):*} callback function to execute, it is
         * invoked with one argument: the element value, to break the iteration you can
         * optionally return false.
         */
        LinkedList.prototype.forEach = function (callback) {
            var currentNode = this.firstNode;
            while (currentNode !== null) {
                if (callback(currentNode.element) === false) {
                    break;
                }
                currentNode = currentNode.next;
            }
        };
        /**
         * Reverses the order of the elements in this linked list (makes the last
         * element first, and the first element last).
         */
        LinkedList.prototype.reverse = function () {
            var previous = null;
            var current = this.firstNode;
            var temp = null;
            while (current !== null) {
                temp = current.next;
                current.next = previous;
                previous = current;
                current = temp;
            }
            temp = this.firstNode;
            this.firstNode = this.lastNode;
            this.lastNode = temp;
        };
        /**
         * Returns an array containing all of the elements in this list in proper
         * sequence.
         * @return {Array.<*>} an array containing all of the elements in this list,
         * in proper sequence.
         */
        LinkedList.prototype.toArray = function () {
            var array = [];
            var currentNode = this.firstNode;
            while (currentNode !== null) {
                array.push(currentNode.element);
                currentNode = currentNode.next;
            }
            return array;
        };
        /**
         * Returns the number of elements in this list.
         * @return {number} the number of elements in this list.
         */
        LinkedList.prototype.size = function () {
            return this.nElements;
        };
        /**
         * Returns true if this list contains no elements.
         * @return {boolean} true if this list contains no elements.
         */
        LinkedList.prototype.isEmpty = function () {
            return this.nElements <= 0;
        };
        LinkedList.prototype.toString = function () {
            return collections.arrays.toString(this.toArray());
        };
        /**
         * @private
         */
        LinkedList.prototype.nodeAtIndex = function (index) {
            if (index < 0 || index >= this.nElements) {
                return null;
            }
            if (index === (this.nElements - 1)) {
                return this.lastNode;
            }
            var node = this.firstNode;
            for (var i = 0; i < index; i++) {
                node = node.next;
            }
            return node;
        };
        /**
         * @private
         */
        LinkedList.prototype.createNode = function (item) {
            return {
                element: item,
                next: null
            };
        };
        return LinkedList;
    }());
    collections.LinkedList = LinkedList; // End of linked list 
    var Dictionary = (function () {
        /**
         * Creates an empty dictionary.
         * @class <p>Dictionaries map keys to values; each key can map to at most one value.
         * This implementation accepts any kind of objects as keys.</p>
         *
         * <p>If the keys are custom objects a function which converts keys to unique
         * strings must be provided. Example:</p>
         * <pre>
         * function petToString(pet) {
         *  return pet.name;
         * }
         * </pre>
         * @constructor
         * @param {function(Object):string=} toStrFunction optional function used
         * to convert keys to strings. If the keys aren't strings or if toString()
         * is not appropriate, a custom function which receives a key and returns a
         * unique string must be provided.
         */
        function Dictionary(toStrFunction) {
            this.table = {};
            this.nElements = 0;
            this.toStr = toStrFunction || collections.defaultToString;
        }
        /**
         * Returns the value to which this dictionary maps the specified key.
         * Returns undefined if this dictionary contains no mapping for this key.
         * @param {Object} key key whose associated value is to be returned.
         * @return {*} the value to which this dictionary maps the specified key or
         * undefined if the map contains no mapping for this key.
         */
        Dictionary.prototype.getValue = function (key) {
            var pair = this.table['$' + this.toStr(key)];
            if (collections.isUndefined(pair)) {
                return undefined;
            }
            return pair.value;
        };
        /**
         * Associates the specified value with the specified key in this dictionary.
         * If the dictionary previously contained a mapping for this key, the old
         * value is replaced by the specified value.
         * @param {Object} key key with which the specified value is to be
         * associated.
         * @param {Object} value value to be associated with the specified key.
         * @return {*} previous value associated with the specified key, or undefined if
         * there was no mapping for the key or if the key/value are undefined.
         */
        Dictionary.prototype.setValue = function (key, value) {
            if (collections.isUndefined(key) || collections.isUndefined(value)) {
                return undefined;
            }
            var ret;
            var k = '$' + this.toStr(key);
            var previousElement = this.table[k];
            if (collections.isUndefined(previousElement)) {
                this.nElements++;
                ret = undefined;
            }
            else {
                ret = previousElement.value;
            }
            this.table[k] = {
                key: key,
                value: value
            };
            return ret;
        };
        /**
         * Removes the mapping for this key from this dictionary if it is present.
         * @param {Object} key key whose mapping is to be removed from the
         * dictionary.
         * @return {*} previous value associated with specified key, or undefined if
         * there was no mapping for key.
         */
        Dictionary.prototype.remove = function (key) {
            var k = '$' + this.toStr(key);
            var previousElement = this.table[k];
            if (!collections.isUndefined(previousElement)) {
                delete this.table[k];
                this.nElements--;
                return previousElement.value;
            }
            return undefined;
        };
        /**
         * Returns an array containing all of the keys in this dictionary.
         * @return {Array} an array containing all of the keys in this dictionary.
         */
        Dictionary.prototype.keys = function () {
            var array = [];
            for (var name in this.table) {
                if (has(this.table, name)) {
                    var pair = this.table[name];
                    array.push(pair.key);
                }
            }
            return array;
        };
        /**
         * Returns an array containing all of the values in this dictionary.
         * @return {Array} an array containing all of the values in this dictionary.
         */
        Dictionary.prototype.values = function () {
            var array = [];
            for (var name in this.table) {
                if (has(this.table, name)) {
                    var pair = this.table[name];
                    array.push(pair.value);
                }
            }
            return array;
        };
        /**
        * Executes the provided function once for each key-value pair
        * present in this dictionary.
        * @param {function(Object,Object):*} callback function to execute, it is
        * invoked with two arguments: key and value. To break the iteration you can
        * optionally return false.
        */
        Dictionary.prototype.forEach = function (callback) {
            for (var name in this.table) {
                if (has(this.table, name)) {
                    var pair = this.table[name];
                    var ret = callback(pair.key, pair.value);
                    if (ret === false) {
                        return;
                    }
                }
            }
        };
        /**
         * Returns true if this dictionary contains a mapping for the specified key.
         * @param {Object} key key whose presence in this dictionary is to be
         * tested.
         * @return {boolean} true if this dictionary contains a mapping for the
         * specified key.
         */
        Dictionary.prototype.containsKey = function (key) {
            return !collections.isUndefined(this.getValue(key));
        };
        /**
        * Removes all mappings from this dictionary.
        * @this {collections.Dictionary}
        */
        Dictionary.prototype.clear = function () {
            this.table = {};
            this.nElements = 0;
        };
        /**
         * Returns the number of keys in this dictionary.
         * @return {number} the number of key-value mappings in this dictionary.
         */
        Dictionary.prototype.size = function () {
            return this.nElements;
        };
        /**
         * Returns true if this dictionary contains no mappings.
         * @return {boolean} true if this dictionary contains no mappings.
         */
        Dictionary.prototype.isEmpty = function () {
            return this.nElements <= 0;
        };
        Dictionary.prototype.toString = function () {
            var toret = "{";
            this.forEach(function (k, v) {
                toret = toret + "\n\t" + k.toString() + " : " + v.toString();
            });
            return toret + "\n}";
        };
        return Dictionary;
    }());
    collections.Dictionary = Dictionary; // End of dictionary
    /**
     * This class is used by the LinkedDictionary Internally
     * Has to be a class, not an interface, because it needs to have
     * the 'unlink' function defined.
     */
    var LinkedDictionaryPair = (function () {
        function LinkedDictionaryPair(key, value) {
            this.key = key;
            this.value = value;
        }
        LinkedDictionaryPair.prototype.unlink = function () {
            this.prev.next = this.next;
            this.next.prev = this.prev;
        };
        return LinkedDictionaryPair;
    }());
    var LinkedDictionary = (function (_super) {
        __extends(LinkedDictionary, _super);
        function LinkedDictionary(toStrFunction) {
            _super.call(this, toStrFunction);
            this.head = new LinkedDictionaryPair(null, null);
            this.tail = new LinkedDictionaryPair(null, null);
            this.head.next = this.tail;
            this.tail.prev = this.head;
        }
        /**
         * Inserts the new node to the 'tail' of the list, updating the
         * neighbors, and moving 'this.tail' (the End of List indicator) that
         * to the end.
         */
        LinkedDictionary.prototype.appendToTail = function (entry) {
            var lastNode = this.tail.prev;
            lastNode.next = entry;
            entry.prev = lastNode;
            entry.next = this.tail;
            this.tail.prev = entry;
        };
        /**
         * Retrieves a linked dictionary from the table internally
         */
        LinkedDictionary.prototype.getLinkedDictionaryPair = function (key) {
            if (collections.isUndefined(key)) {
                return undefined;
            }
            var k = '$' + this.toStr(key);
            var pair = (this.table[k]);
            return pair;
        };
        /**
         * Returns the value to which this dictionary maps the specified key.
         * Returns undefined if this dictionary contains no mapping for this key.
         * @param {Object} key key whose associated value is to be returned.
         * @return {*} the value to which this dictionary maps the specified key or
         * undefined if the map contains no mapping for this key.
         */
        LinkedDictionary.prototype.getValue = function (key) {
            var pair = this.getLinkedDictionaryPair(key);
            if (!collections.isUndefined(pair)) {
                return pair.value;
            }
            return undefined;
        };
        /**
         * Removes the mapping for this key from this dictionary if it is present.
         * Also, if a value is present for this key, the entry is removed from the
         * insertion ordering.
         * @param {Object} key key whose mapping is to be removed from the
         * dictionary.
         * @return {*} previous value associated with specified key, or undefined if
         * there was no mapping for key.
         */
        LinkedDictionary.prototype.remove = function (key) {
            var pair = this.getLinkedDictionaryPair(key);
            if (!collections.isUndefined(pair)) {
                _super.prototype.remove.call(this, key); // This will remove it from the table
                pair.unlink(); // This will unlink it from the chain
                return pair.value;
            }
            return undefined;
        };
        /**
        * Removes all mappings from this LinkedDictionary.
        * @this {collections.LinkedDictionary}
        */
        LinkedDictionary.prototype.clear = function () {
            _super.prototype.clear.call(this);
            this.head.next = this.tail;
            this.tail.prev = this.head;
        };
        /**
         * Internal function used when updating an existing KeyValue pair.
         * It places the new value indexed by key into the table, but maintains
         * its place in the linked ordering.
         */
        LinkedDictionary.prototype.replace = function (oldPair, newPair) {
            var k = '$' + this.toStr(newPair.key);
            // set the new Pair's links to existingPair's links
            newPair.next = oldPair.next;
            newPair.prev = oldPair.prev;
            // Delete Existing Pair from the table, unlink it from chain.
            // As a result, the nElements gets decremented by this operation
            this.remove(oldPair.key);
            // Link new Pair in place of where oldPair was,
            // by pointing the old pair's neighbors to it.
            newPair.prev.next = newPair;
            newPair.next.prev = newPair;
            this.table[k] = newPair;
            // To make up for the fact that the number of elements was decremented,
            // We need to increase it by one.
            ++this.nElements;
        };
        /**
         * Associates the specified value with the specified key in this dictionary.
         * If the dictionary previously contained a mapping for this key, the old
         * value is replaced by the specified value.
         * Updating of a key that already exists maintains its place in the
         * insertion order into the map.
         * @param {Object} key key with which the specified value is to be
         * associated.
         * @param {Object} value value to be associated with the specified key.
         * @return {*} previous value associated with the specified key, or undefined if
         * there was no mapping for the key or if the key/value are undefined.
         */
        LinkedDictionary.prototype.setValue = function (key, value) {
            if (collections.isUndefined(key) || collections.isUndefined(value)) {
                return undefined;
            }
            var existingPair = this.getLinkedDictionaryPair(key);
            var newPair = new LinkedDictionaryPair(key, value);
            var k = '$' + this.toStr(key);
            // If there is already an element for that key, we 
            // keep it's place in the LinkedList
            if (!collections.isUndefined(existingPair)) {
                this.replace(existingPair, newPair);
                return existingPair.value;
            }
            else {
                this.appendToTail(newPair);
                this.table[k] = newPair;
                ++this.nElements;
                return undefined;
            }
        };
        /**
         * Returns an array containing all of the keys in this LinkedDictionary, ordered
         * by insertion order.
         * @return {Array} an array containing all of the keys in this LinkedDictionary,
         * ordered by insertion order.
         */
        LinkedDictionary.prototype.keys = function () {
            var array = [];
            this.forEach(function (key, value) {
                array.push(key);
            });
            return array;
        };
        /**
         * Returns an array containing all of the values in this LinkedDictionary, ordered by
         * insertion order.
         * @return {Array} an array containing all of the values in this LinkedDictionary,
         * ordered by insertion order.
         */
        LinkedDictionary.prototype.values = function () {
            var array = [];
            this.forEach(function (key, value) {
                array.push(value);
            });
            return array;
        };
        /**
        * Executes the provided function once for each key-value pair
        * present in this LinkedDictionary. It is done in the order of insertion
        * into the LinkedDictionary
        * @param {function(Object,Object):*} callback function to execute, it is
        * invoked with two arguments: key and value. To break the iteration you can
        * optionally return false.
        */
        LinkedDictionary.prototype.forEach = function (callback) {
            var crawlNode = this.head.next;
            while (crawlNode.next != null) {
                var ret = callback(crawlNode.key, crawlNode.value);
                if (ret === false) {
                    return;
                }
                crawlNode = crawlNode.next;
            }
        };
        return LinkedDictionary;
    }(Dictionary));
    collections.LinkedDictionary = LinkedDictionary; // End of LinkedDictionary
    // /**
    //  * Returns true if this dictionary is equal to the given dictionary.
    //  * Two dictionaries are equal if they contain the same mappings.
    //  * @param {collections.Dictionary} other the other dictionary.
    //  * @param {function(Object,Object):boolean=} valuesEqualFunction optional
    //  * function used to check if two values are equal.
    //  * @return {boolean} true if this dictionary is equal to the given dictionary.
    //  */
    // collections.Dictionary.prototype.equals = function(other,valuesEqualFunction) {
    // 	var eqF = valuesEqualFunction || collections.defaultEquals;
    // 	if(!(other instanceof collections.Dictionary)){
    // 		return false;
    // 	}
    // 	if(this.size() !== other.size()){
    // 		return false;
    // 	}
    // 	return this.equalsAux(this.firstNode,other.firstNode,eqF);
    // }
    var MultiDictionary = (function () {
        /**
         * Creates an empty multi dictionary.
         * @class <p>A multi dictionary is a special kind of dictionary that holds
         * multiple values against each key. Setting a value into the dictionary will
         * add the value to an array at that key. Getting a key will return an array,
         * holding all the values set to that key.
         * You can configure to allow duplicates in the values.
         * This implementation accepts any kind of objects as keys.</p>
         *
         * <p>If the keys are custom objects a function which converts keys to strings must be
         * provided. Example:</p>
         *
         * <pre>
         * function petToString(pet) {
           *  return pet.name;
           * }
         * </pre>
         * <p>If the values are custom objects a function to check equality between values
         * must be provided. Example:</p>
         *
         * <pre>
         * function petsAreEqualByAge(pet1,pet2) {
           *  return pet1.age===pet2.age;
           * }
         * </pre>
         * @constructor
         * @param {function(Object):string=} toStrFunction optional function
         * to convert keys to strings. If the keys aren't strings or if toString()
         * is not appropriate, a custom function which receives a key and returns a
         * unique string must be provided.
         * @param {function(Object,Object):boolean=} valuesEqualsFunction optional
         * function to check if two values are equal.
         *
         * @param allowDuplicateValues
         */
        function MultiDictionary(toStrFunction, valuesEqualsFunction, allowDuplicateValues) {
            if (allowDuplicateValues === void 0) { allowDuplicateValues = false; }
            this.dict = new Dictionary(toStrFunction);
            this.equalsF = valuesEqualsFunction || collections.defaultEquals;
            this.allowDuplicate = allowDuplicateValues;
        }
        /**
        * Returns an array holding the values to which this dictionary maps
        * the specified key.
        * Returns an empty array if this dictionary contains no mappings for this key.
        * @param {Object} key key whose associated values are to be returned.
        * @return {Array} an array holding the values to which this dictionary maps
        * the specified key.
        */
        MultiDictionary.prototype.getValue = function (key) {
            var values = this.dict.getValue(key);
            if (collections.isUndefined(values)) {
                return [];
            }
            return collections.arrays.copy(values);
        };
        /**
         * Adds the value to the array associated with the specified key, if
         * it is not already present.
         * @param {Object} key key with which the specified value is to be
         * associated.
         * @param {Object} value the value to add to the array at the key
         * @return {boolean} true if the value was not already associated with that key.
         */
        MultiDictionary.prototype.setValue = function (key, value) {
            if (collections.isUndefined(key) || collections.isUndefined(value)) {
                return false;
            }
            if (!this.containsKey(key)) {
                this.dict.setValue(key, [value]);
                return true;
            }
            var array = this.dict.getValue(key);
            if (!this.allowDuplicate) {
                if (collections.arrays.contains(array, value, this.equalsF)) {
                    return false;
                }
            }
            array.push(value);
            return true;
        };
        /**
         * Removes the specified values from the array of values associated with the
         * specified key. If a value isn't given, all values associated with the specified
         * key are removed.
         * @param {Object} key key whose mapping is to be removed from the
         * dictionary.
         * @param {Object=} value optional argument to specify the value to remove
         * from the array associated with the specified key.
         * @return {*} true if the dictionary changed, false if the key doesn't exist or
         * if the specified value isn't associated with the specified key.
         */
        MultiDictionary.prototype.remove = function (key, value) {
            if (collections.isUndefined(value)) {
                var v = this.dict.remove(key);
                return !collections.isUndefined(v);
            }
            var array = this.dict.getValue(key);
            if (collections.arrays.remove(array, value, this.equalsF)) {
                if (array.length === 0) {
                    this.dict.remove(key);
                }
                return true;
            }
            return false;
        };
        /**
         * Returns an array containing all of the keys in this dictionary.
         * @return {Array} an array containing all of the keys in this dictionary.
         */
        MultiDictionary.prototype.keys = function () {
            return this.dict.keys();
        };
        /**
         * Returns an array containing all of the values in this dictionary.
         * @return {Array} an array containing all of the values in this dictionary.
         */
        MultiDictionary.prototype.values = function () {
            var values = this.dict.values();
            var array = [];
            for (var i = 0; i < values.length; i++) {
                var v = values[i];
                for (var j = 0; j < v.length; j++) {
                    array.push(v[j]);
                }
            }
            return array;
        };
        /**
         * Returns true if this dictionary at least one value associatted the specified key.
         * @param {Object} key key whose presence in this dictionary is to be
         * tested.
         * @return {boolean} true if this dictionary at least one value associatted
         * the specified key.
         */
        MultiDictionary.prototype.containsKey = function (key) {
            return this.dict.containsKey(key);
        };
        /**
         * Removes all mappings from this dictionary.
         */
        MultiDictionary.prototype.clear = function () {
            this.dict.clear();
        };
        /**
         * Returns the number of keys in this dictionary.
         * @return {number} the number of key-value mappings in this dictionary.
         */
        MultiDictionary.prototype.size = function () {
            return this.dict.size();
        };
        /**
         * Returns true if this dictionary contains no mappings.
         * @return {boolean} true if this dictionary contains no mappings.
         */
        MultiDictionary.prototype.isEmpty = function () {
            return this.dict.isEmpty();
        };
        return MultiDictionary;
    }());
    collections.MultiDictionary = MultiDictionary; // end of multi dictionary 
    var Heap = (function () {
        /**
         * Creates an empty Heap.
         * @class
         * <p>A heap is a binary tree, where the nodes maintain the heap property:
         * each node is smaller than each of its children and therefore a MinHeap
         * This implementation uses an array to store elements.</p>
         * <p>If the inserted elements are custom objects a compare function must be provided,
         *  at construction time, otherwise the <=, === and >= operators are
         * used to compare elements. Example:</p>
         *
         * <pre>
         * function compare(a, b) {
         *  if (a is less than b by some ordering criterion) {
         *     return -1;
         *  } if (a is greater than b by the ordering criterion) {
         *     return 1;
         *  }
         *  // a must be equal to b
         *  return 0;
         * }
         * </pre>
         *
         * <p>If a Max-Heap is wanted (greater elements on top) you can a provide a
         * reverse compare function to accomplish that behavior. Example:</p>
         *
         * <pre>
         * function reverseCompare(a, b) {
         *  if (a is less than b by some ordering criterion) {
         *     return 1;
         *  } if (a is greater than b by the ordering criterion) {
         *     return -1;
         *  }
         *  // a must be equal to b
         *  return 0;
         * }
         * </pre>
         *
         * @constructor
         * @param {function(Object,Object):number=} compareFunction optional
         * function used to compare two elements. Must return a negative integer,
         * zero, or a positive integer as the first argument is less than, equal to,
         * or greater than the second.
         */
        function Heap(compareFunction) {
            /**
             * Array used to store the elements od the heap.
             * @type {Array.<Object>}
             * @private
             */
            this.data = [];
            this.compare = compareFunction || collections.defaultCompare;
        }
        /**
         * Returns the index of the left child of the node at the given index.
         * @param {number} nodeIndex The index of the node to get the left child
         * for.
         * @return {number} The index of the left child.
         * @private
         */
        Heap.prototype.leftChildIndex = function (nodeIndex) {
            return (2 * nodeIndex) + 1;
        };
        /**
         * Returns the index of the right child of the node at the given index.
         * @param {number} nodeIndex The index of the node to get the right child
         * for.
         * @return {number} The index of the right child.
         * @private
         */
        Heap.prototype.rightChildIndex = function (nodeIndex) {
            return (2 * nodeIndex) + 2;
        };
        /**
         * Returns the index of the parent of the node at the given index.
         * @param {number} nodeIndex The index of the node to get the parent for.
         * @return {number} The index of the parent.
         * @private
         */
        Heap.prototype.parentIndex = function (nodeIndex) {
            return Math.floor((nodeIndex - 1) / 2);
        };
        /**
         * Returns the index of the smaller child node (if it exists).
         * @param {number} leftChild left child index.
         * @param {number} rightChild right child index.
         * @return {number} the index with the minimum value or -1 if it doesn't
         * exists.
         * @private
         */
        Heap.prototype.minIndex = function (leftChild, rightChild) {
            if (rightChild >= this.data.length) {
                if (leftChild >= this.data.length) {
                    return -1;
                }
                else {
                    return leftChild;
                }
            }
            else {
                if (this.compare(this.data[leftChild], this.data[rightChild]) <= 0) {
                    return leftChild;
                }
                else {
                    return rightChild;
                }
            }
        };
        /**
         * Moves the node at the given index up to its proper place in the heap.
         * @param {number} index The index of the node to move up.
         * @private
         */
        Heap.prototype.siftUp = function (index) {
            var parent = this.parentIndex(index);
            while (index > 0 && this.compare(this.data[parent], this.data[index]) > 0) {
                collections.arrays.swap(this.data, parent, index);
                index = parent;
                parent = this.parentIndex(index);
            }
        };
        /**
         * Moves the node at the given index down to its proper place in the heap.
         * @param {number} nodeIndex The index of the node to move down.
         * @private
         */
        Heap.prototype.siftDown = function (nodeIndex) {
            //smaller child index
            var min = this.minIndex(this.leftChildIndex(nodeIndex), this.rightChildIndex(nodeIndex));
            while (min >= 0 && this.compare(this.data[nodeIndex], this.data[min]) > 0) {
                collections.arrays.swap(this.data, min, nodeIndex);
                nodeIndex = min;
                min = this.minIndex(this.leftChildIndex(nodeIndex), this.rightChildIndex(nodeIndex));
            }
        };
        /**
         * Retrieves but does not remove the root element of this heap.
         * @return {*} The value at the root of the heap. Returns undefined if the
         * heap is empty.
         */
        Heap.prototype.peek = function () {
            if (this.data.length > 0) {
                return this.data[0];
            }
            else {
                return undefined;
            }
        };
        /**
         * Adds the given element into the heap.
         * @param {*} element the element.
         * @return true if the element was added or fals if it is undefined.
         */
        Heap.prototype.add = function (element) {
            if (collections.isUndefined(element)) {
                return undefined;
            }
            this.data.push(element);
            this.siftUp(this.data.length - 1);
            return true;
        };
        /**
         * Retrieves and removes the root element of this heap.
         * @return {*} The value removed from the root of the heap. Returns
         * undefined if the heap is empty.
         */
        Heap.prototype.removeRoot = function () {
            if (this.data.length > 0) {
                var obj = this.data[0];
                this.data[0] = this.data[this.data.length - 1];
                this.data.splice(this.data.length - 1, 1);
                if (this.data.length > 0) {
                    this.siftDown(0);
                }
                return obj;
            }
            return undefined;
        };
        /**
         * Returns true if this heap contains the specified element.
         * @param {Object} element element to search for.
         * @return {boolean} true if this Heap contains the specified element, false
         * otherwise.
         */
        Heap.prototype.contains = function (element) {
            var equF = collections.compareToEquals(this.compare);
            return collections.arrays.contains(this.data, element, equF);
        };
        /**
         * Returns the number of elements in this heap.
         * @return {number} the number of elements in this heap.
         */
        Heap.prototype.size = function () {
            return this.data.length;
        };
        /**
         * Checks if this heap is empty.
         * @return {boolean} true if and only if this heap contains no items; false
         * otherwise.
         */
        Heap.prototype.isEmpty = function () {
            return this.data.length <= 0;
        };
        /**
         * Removes all of the elements from this heap.
         */
        Heap.prototype.clear = function () {
            this.data.length = 0;
        };
        /**
         * Executes the provided function once for each element present in this heap in
         * no particular order.
         * @param {function(Object):*} callback function to execute, it is
         * invoked with one argument: the element value, to break the iteration you can
         * optionally return false.
         */
        Heap.prototype.forEach = function (callback) {
            collections.arrays.forEach(this.data, callback);
        };
        return Heap;
    }());
    collections.Heap = Heap;
    var Stack = (function () {
        /**
         * Creates an empty Stack.
         * @class A Stack is a Last-In-First-Out (LIFO) data structure, the last
         * element added to the stack will be the first one to be removed. This
         * implementation uses a linked list as a container.
         * @constructor
         */
        function Stack() {
            this.list = new LinkedList();
        }
        /**
         * Pushes an item onto the top of this stack.
         * @param {Object} elem the element to be pushed onto this stack.
         * @return {boolean} true if the element was pushed or false if it is undefined.
         */
        Stack.prototype.push = function (elem) {
            return this.list.add(elem, 0);
        };
        /**
         * Pushes an item onto the top of this stack.
         * @param {Object} elem the element to be pushed onto this stack.
         * @return {boolean} true if the element was pushed or false if it is undefined.
         */
        Stack.prototype.add = function (elem) {
            return this.list.add(elem, 0);
        };
        /**
         * Removes the object at the top of this stack and returns that object.
         * @return {*} the object at the top of this stack or undefined if the
         * stack is empty.
         */
        Stack.prototype.pop = function () {
            return this.list.removeElementAtIndex(0);
        };
        /**
         * Looks at the object at the top of this stack without removing it from the
         * stack.
         * @return {*} the object at the top of this stack or undefined if the
         * stack is empty.
         */
        Stack.prototype.peek = function () {
            return this.list.first();
        };
        /**
         * Returns the number of elements in this stack.
         * @return {number} the number of elements in this stack.
         */
        Stack.prototype.size = function () {
            return this.list.size();
        };
        /**
         * Returns true if this stack contains the specified element.
         * <p>If the elements inside this stack are
         * not comparable with the === operator, a custom equals function should be
         * provided to perform searches, the function must receive two arguments and
         * return true if they are equal, false otherwise. Example:</p>
         *
         * <pre>
         * var petsAreEqualByName (pet1, pet2) {
         *  return pet1.name === pet2.name;
         * }
         * </pre>
         * @param {Object} elem element to search for.
         * @param {function(Object,Object):boolean=} equalsFunction optional
         * function to check if two elements are equal.
         * @return {boolean} true if this stack contains the specified element,
         * false otherwise.
         */
        Stack.prototype.contains = function (elem, equalsFunction) {
            return this.list.contains(elem, equalsFunction);
        };
        /**
         * Checks if this stack is empty.
         * @return {boolean} true if and only if this stack contains no items; false
         * otherwise.
         */
        Stack.prototype.isEmpty = function () {
            return this.list.isEmpty();
        };
        /**
         * Removes all of the elements from this stack.
         */
        Stack.prototype.clear = function () {
            this.list.clear();
        };
        /**
         * Executes the provided function once for each element present in this stack in
         * LIFO order.
         * @param {function(Object):*} callback function to execute, it is
         * invoked with one argument: the element value, to break the iteration you can
         * optionally return false.
         */
        Stack.prototype.forEach = function (callback) {
            this.list.forEach(callback);
        };
        return Stack;
    }());
    collections.Stack = Stack; // End of stack 
    var Queue = (function () {
        /**
         * Creates an empty queue.
         * @class A queue is a First-In-First-Out (FIFO) data structure, the first
         * element added to the queue will be the first one to be removed. This
         * implementation uses a linked list as a container.
         * @constructor
         */
        function Queue() {
            this.list = new LinkedList();
        }
        /**
         * Inserts the specified element into the end of this queue.
         * @param {Object} elem the element to insert.
         * @return {boolean} true if the element was inserted, or false if it is undefined.
         */
        Queue.prototype.enqueue = function (elem) {
            return this.list.add(elem);
        };
        /**
         * Inserts the specified element into the end of this queue.
         * @param {Object} elem the element to insert.
         * @return {boolean} true if the element was inserted, or false if it is undefined.
         */
        Queue.prototype.add = function (elem) {
            return this.list.add(elem);
        };
        /**
         * Retrieves and removes the head of this queue.
         * @return {*} the head of this queue, or undefined if this queue is empty.
         */
        Queue.prototype.dequeue = function () {
            if (this.list.size() !== 0) {
                var el = this.list.first();
                this.list.removeElementAtIndex(0);
                return el;
            }
            return undefined;
        };
        /**
         * Retrieves, but does not remove, the head of this queue.
         * @return {*} the head of this queue, or undefined if this queue is empty.
         */
        Queue.prototype.peek = function () {
            if (this.list.size() !== 0) {
                return this.list.first();
            }
            return undefined;
        };
        /**
         * Returns the number of elements in this queue.
         * @return {number} the number of elements in this queue.
         */
        Queue.prototype.size = function () {
            return this.list.size();
        };
        /**
         * Returns true if this queue contains the specified element.
         * <p>If the elements inside this stack are
         * not comparable with the === operator, a custom equals function should be
         * provided to perform searches, the function must receive two arguments and
         * return true if they are equal, false otherwise. Example:</p>
         *
         * <pre>
         * var petsAreEqualByName (pet1, pet2) {
         *  return pet1.name === pet2.name;
         * }
         * </pre>
         * @param {Object} elem element to search for.
         * @param {function(Object,Object):boolean=} equalsFunction optional
         * function to check if two elements are equal.
         * @return {boolean} true if this queue contains the specified element,
         * false otherwise.
         */
        Queue.prototype.contains = function (elem, equalsFunction) {
            return this.list.contains(elem, equalsFunction);
        };
        /**
         * Checks if this queue is empty.
         * @return {boolean} true if and only if this queue contains no items; false
         * otherwise.
         */
        Queue.prototype.isEmpty = function () {
            return this.list.size() <= 0;
        };
        /**
         * Removes all of the elements from this queue.
         */
        Queue.prototype.clear = function () {
            this.list.clear();
        };
        /**
         * Executes the provided function once for each element present in this queue in
         * FIFO order.
         * @param {function(Object):*} callback function to execute, it is
         * invoked with one argument: the element value, to break the iteration you can
         * optionally return false.
         */
        Queue.prototype.forEach = function (callback) {
            this.list.forEach(callback);
        };
        return Queue;
    }());
    collections.Queue = Queue; // End of queue
    var PriorityQueue = (function () {
        /**
         * Creates an empty priority queue.
         * @class <p>In a priority queue each element is associated with a "priority",
         * elements are dequeued in highest-priority-first order (the elements with the
         * highest priority are dequeued first). Priority Queues are implemented as heaps.
         * If the inserted elements are custom objects a compare function must be provided,
         * otherwise the <=, === and >= operators are used to compare object priority.</p>
         * <pre>
         * function compare(a, b) {
         *  if (a is less than b by some ordering criterion) {
         *     return -1;
         *  } if (a is greater than b by the ordering criterion) {
         *     return 1;
         *  }
         *  // a must be equal to b
         *  return 0;
         * }
         * </pre>
         * @constructor
         * @param {function(Object,Object):number=} compareFunction optional
         * function used to compare two element priorities. Must return a negative integer,
         * zero, or a positive integer as the first argument is less than, equal to,
         * or greater than the second.
         */
        function PriorityQueue(compareFunction) {
            this.heap = new Heap(collections.reverseCompareFunction(compareFunction));
        }
        /**
         * Inserts the specified element into this priority queue.
         * @param {Object} element the element to insert.
         * @return {boolean} true if the element was inserted, or false if it is undefined.
         */
        PriorityQueue.prototype.enqueue = function (element) {
            return this.heap.add(element);
        };
        /**
         * Inserts the specified element into this priority queue.
         * @param {Object} element the element to insert.
         * @return {boolean} true if the element was inserted, or false if it is undefined.
         */
        PriorityQueue.prototype.add = function (element) {
            return this.heap.add(element);
        };
        /**
         * Retrieves and removes the highest priority element of this queue.
         * @return {*} the the highest priority element of this queue,
         *  or undefined if this queue is empty.
         */
        PriorityQueue.prototype.dequeue = function () {
            if (this.heap.size() !== 0) {
                var el = this.heap.peek();
                this.heap.removeRoot();
                return el;
            }
            return undefined;
        };
        /**
         * Retrieves, but does not remove, the highest priority element of this queue.
         * @return {*} the highest priority element of this queue, or undefined if this queue is empty.
         */
        PriorityQueue.prototype.peek = function () {
            return this.heap.peek();
        };
        /**
         * Returns true if this priority queue contains the specified element.
         * @param {Object} element element to search for.
         * @return {boolean} true if this priority queue contains the specified element,
         * false otherwise.
         */
        PriorityQueue.prototype.contains = function (element) {
            return this.heap.contains(element);
        };
        /**
         * Checks if this priority queue is empty.
         * @return {boolean} true if and only if this priority queue contains no items; false
         * otherwise.
         */
        PriorityQueue.prototype.isEmpty = function () {
            return this.heap.isEmpty();
        };
        /**
         * Returns the number of elements in this priority queue.
         * @return {number} the number of elements in this priority queue.
         */
        PriorityQueue.prototype.size = function () {
            return this.heap.size();
        };
        /**
         * Removes all of the elements from this priority queue.
         */
        PriorityQueue.prototype.clear = function () {
            this.heap.clear();
        };
        /**
         * Executes the provided function once for each element present in this queue in
         * no particular order.
         * @param {function(Object):*} callback function to execute, it is
         * invoked with one argument: the element value, to break the iteration you can
         * optionally return false.
         */
        PriorityQueue.prototype.forEach = function (callback) {
            this.heap.forEach(callback);
        };
        return PriorityQueue;
    }());
    collections.PriorityQueue = PriorityQueue; // end of priority queue
    var Set = (function () {
        /**
         * Creates an empty set.
         * @class <p>A set is a data structure that contains no duplicate items.</p>
         * <p>If the inserted elements are custom objects a function
         * which converts elements to strings must be provided. Example:</p>
         *
         * <pre>
         * function petToString(pet) {
         *  return pet.name;
         * }
         * </pre>
         *
         * @constructor
         * @param {function(Object):string=} toStringFunction optional function used
         * to convert elements to strings. If the elements aren't strings or if toString()
         * is not appropriate, a custom function which receives a onject and returns a
         * unique string must be provided.
         */
        function Set(toStringFunction) {
            this.dictionary = new Dictionary(toStringFunction);
        }
        /**
         * Returns true if this set contains the specified element.
         * @param {Object} element element to search for.
         * @return {boolean} true if this set contains the specified element,
         * false otherwise.
         */
        Set.prototype.contains = function (element) {
            return this.dictionary.containsKey(element);
        };
        /**
         * Adds the specified element to this set if it is not already present.
         * @param {Object} element the element to insert.
         * @return {boolean} true if this set did not already contain the specified element.
         */
        Set.prototype.add = function (element) {
            if (this.contains(element) || collections.isUndefined(element)) {
                return false;
            }
            else {
                this.dictionary.setValue(element, element);
                return true;
            }
        };
        /**
         * Performs an intersecion between this an another set.
         * Removes all values that are not present this set and the given set.
         * @param {collections.Set} otherSet other set.
         */
        Set.prototype.intersection = function (otherSet) {
            var set = this;
            this.forEach(function (element) {
                if (!otherSet.contains(element)) {
                    set.remove(element);
                }
                return true;
            });
        };
        /**
         * Performs a union between this an another set.
         * Adds all values from the given set to this set.
         * @param {collections.Set} otherSet other set.
         */
        Set.prototype.union = function (otherSet) {
            var set = this;
            otherSet.forEach(function (element) {
                set.add(element);
                return true;
            });
        };
        /**
         * Performs a difference between this an another set.
         * Removes from this set all the values that are present in the given set.
         * @param {collections.Set} otherSet other set.
         */
        Set.prototype.difference = function (otherSet) {
            var set = this;
            otherSet.forEach(function (element) {
                set.remove(element);
                return true;
            });
        };
        /**
         * Checks whether the given set contains all the elements in this set.
         * @param {collections.Set} otherSet other set.
         * @return {boolean} true if this set is a subset of the given set.
         */
        Set.prototype.isSubsetOf = function (otherSet) {
            if (this.size() > otherSet.size()) {
                return false;
            }
            var isSub = true;
            this.forEach(function (element) {
                if (!otherSet.contains(element)) {
                    isSub = false;
                    return false;
                }
                return true;
            });
            return isSub;
        };
        /**
         * Removes the specified element from this set if it is present.
         * @return {boolean} true if this set contained the specified element.
         */
        Set.prototype.remove = function (element) {
            if (!this.contains(element)) {
                return false;
            }
            else {
                this.dictionary.remove(element);
                return true;
            }
        };
        /**
         * Executes the provided function once for each element
         * present in this set.
         * @param {function(Object):*} callback function to execute, it is
         * invoked with one arguments: the element. To break the iteration you can
         * optionally return false.
         */
        Set.prototype.forEach = function (callback) {
            this.dictionary.forEach(function (k, v) {
                return callback(v);
            });
        };
        /**
         * Returns an array containing all of the elements in this set in arbitrary order.
         * @return {Array} an array containing all of the elements in this set.
         */
        Set.prototype.toArray = function () {
            return this.dictionary.values();
        };
        /**
         * Returns true if this set contains no elements.
         * @return {boolean} true if this set contains no elements.
         */
        Set.prototype.isEmpty = function () {
            return this.dictionary.isEmpty();
        };
        /**
         * Returns the number of elements in this set.
         * @return {number} the number of elements in this set.
         */
        Set.prototype.size = function () {
            return this.dictionary.size();
        };
        /**
         * Removes all of the elements from this set.
         */
        Set.prototype.clear = function () {
            this.dictionary.clear();
        };
        /*
        * Provides a string representation for display
        */
        Set.prototype.toString = function () {
            return collections.arrays.toString(this.toArray());
        };
        return Set;
    }());
    collections.Set = Set; // end of Set
    var Bag = (function () {
        /**
         * Creates an empty bag.
         * @class <p>A bag is a special kind of set in which members are
         * allowed to appear more than once.</p>
         * <p>If the inserted elements are custom objects a function
         * which converts elements to unique strings must be provided. Example:</p>
         *
         * <pre>
         * function petToString(pet) {
         *  return pet.name;
         * }
         * </pre>
         *
         * @constructor
         * @param {function(Object):string=} toStrFunction optional function used
         * to convert elements to strings. If the elements aren't strings or if toString()
         * is not appropriate, a custom function which receives an object and returns a
         * unique string must be provided.
         */
        function Bag(toStrFunction) {
            this.toStrF = toStrFunction || collections.defaultToString;
            this.dictionary = new Dictionary(this.toStrF);
            this.nElements = 0;
        }
        /**
        * Adds nCopies of the specified object to this bag.
        * @param {Object} element element to add.
        * @param {number=} nCopies the number of copies to add, if this argument is
        * undefined 1 copy is added.
        * @return {boolean} true unless element is undefined.
        */
        Bag.prototype.add = function (element, nCopies) {
            if (nCopies === void 0) { nCopies = 1; }
            if (collections.isUndefined(element) || nCopies <= 0) {
                return false;
            }
            if (!this.contains(element)) {
                var node = {
                    value: element,
                    copies: nCopies
                };
                this.dictionary.setValue(element, node);
            }
            else {
                this.dictionary.getValue(element).copies += nCopies;
            }
            this.nElements += nCopies;
            return true;
        };
        /**
        * Counts the number of copies of the specified object in this bag.
        * @param {Object} element the object to search for..
        * @return {number} the number of copies of the object, 0 if not found
        */
        Bag.prototype.count = function (element) {
            if (!this.contains(element)) {
                return 0;
            }
            else {
                return this.dictionary.getValue(element).copies;
            }
        };
        /**
         * Returns true if this bag contains the specified element.
         * @param {Object} element element to search for.
         * @return {boolean} true if this bag contains the specified element,
         * false otherwise.
         */
        Bag.prototype.contains = function (element) {
            return this.dictionary.containsKey(element);
        };
        /**
        * Removes nCopies of the specified object to this bag.
        * If the number of copies to remove is greater than the actual number
        * of copies in the Bag, all copies are removed.
        * @param {Object} element element to remove.
        * @param {number=} nCopies the number of copies to remove, if this argument is
        * undefined 1 copy is removed.
        * @return {boolean} true if at least 1 element was removed.
        */
        Bag.prototype.remove = function (element, nCopies) {
            if (nCopies === void 0) { nCopies = 1; }
            if (collections.isUndefined(element) || nCopies <= 0) {
                return false;
            }
            if (!this.contains(element)) {
                return false;
            }
            else {
                var node = this.dictionary.getValue(element);
                if (nCopies > node.copies) {
                    this.nElements -= node.copies;
                }
                else {
                    this.nElements -= nCopies;
                }
                node.copies -= nCopies;
                if (node.copies <= 0) {
                    this.dictionary.remove(element);
                }
                return true;
            }
        };
        /**
         * Returns an array containing all of the elements in this big in arbitrary order,
         * including multiple copies.
         * @return {Array} an array containing all of the elements in this bag.
         */
        Bag.prototype.toArray = function () {
            var a = [];
            var values = this.dictionary.values();
            var vl = values.length;
            for (var i = 0; i < vl; i++) {
                var node = values[i];
                var element = node.value;
                var copies = node.copies;
                for (var j = 0; j < copies; j++) {
                    a.push(element);
                }
            }
            return a;
        };
        /**
         * Returns a set of unique elements in this bag.
         * @return {collections.Set<T>} a set of unique elements in this bag.
         */
        Bag.prototype.toSet = function () {
            var toret = new Set(this.toStrF);
            var elements = this.dictionary.values();
            var l = elements.length;
            for (var i = 0; i < l; i++) {
                var value = elements[i].value;
                toret.add(value);
            }
            return toret;
        };
        /**
         * Executes the provided function once for each element
         * present in this bag, including multiple copies.
         * @param {function(Object):*} callback function to execute, it is
         * invoked with one argument: the element. To break the iteration you can
         * optionally return false.
         */
        Bag.prototype.forEach = function (callback) {
            this.dictionary.forEach(function (k, v) {
                var value = v.value;
                var copies = v.copies;
                for (var i = 0; i < copies; i++) {
                    if (callback(value) === false) {
                        return false;
                    }
                }
                return true;
            });
        };
        /**
         * Returns the number of elements in this bag.
         * @return {number} the number of elements in this bag.
         */
        Bag.prototype.size = function () {
            return this.nElements;
        };
        /**
         * Returns true if this bag contains no elements.
         * @return {boolean} true if this bag contains no elements.
         */
        Bag.prototype.isEmpty = function () {
            return this.nElements === 0;
        };
        /**
         * Removes all of the elements from this bag.
         */
        Bag.prototype.clear = function () {
            this.nElements = 0;
            this.dictionary.clear();
        };
        return Bag;
    }());
    collections.Bag = Bag; // End of bag 
    var BSTree = (function () {
        /**
         * Creates an empty binary search tree.
         * @class <p>A binary search tree is a binary tree in which each
         * internal node stores an element such that the elements stored in the
         * left subtree are less than it and the elements
         * stored in the right subtree are greater.</p>
         * <p>Formally, a binary search tree is a node-based binary tree data structure which
         * has the following properties:</p>
         * <ul>
         * <li>The left subtree of a node contains only nodes with elements less
         * than the node's element</li>
         * <li>The right subtree of a node contains only nodes with elements greater
         * than the node's element</li>
         * <li>Both the left and right subtrees must also be binary search trees.</li>
         * </ul>
         * <p>If the inserted elements are custom objects a compare function must
         * be provided at construction time, otherwise the <=, === and >= operators are
         * used to compare elements. Example:</p>
         * <pre>
         * function compare(a, b) {
         *  if (a is less than b by some ordering criterion) {
         *     return -1;
         *  } if (a is greater than b by the ordering criterion) {
         *     return 1;
         *  }
         *  // a must be equal to b
         *  return 0;
         * }
         * </pre>
         * @constructor
         * @param {function(Object,Object):number=} compareFunction optional
         * function used to compare two elements. Must return a negative integer,
         * zero, or a positive integer as the first argument is less than, equal to,
         * or greater than the second.
         */
        function BSTree(compareFunction) {
            this.root = null;
            this.compare = compareFunction || collections.defaultCompare;
            this.nElements = 0;
        }
        /**
         * Adds the specified element to this tree if it is not already present.
         * @param {Object} element the element to insert.
         * @return {boolean} true if this tree did not already contain the specified element.
         */
        BSTree.prototype.add = function (element) {
            if (collections.isUndefined(element)) {
                return false;
            }
            if (this.insertNode(this.createNode(element)) !== null) {
                this.nElements++;
                return true;
            }
            return false;
        };
        /**
         * Removes all of the elements from this tree.
         */
        BSTree.prototype.clear = function () {
            this.root = null;
            this.nElements = 0;
        };
        /**
         * Returns true if this tree contains no elements.
         * @return {boolean} true if this tree contains no elements.
         */
        BSTree.prototype.isEmpty = function () {
            return this.nElements === 0;
        };
        /**
         * Returns the number of elements in this tree.
         * @return {number} the number of elements in this tree.
         */
        BSTree.prototype.size = function () {
            return this.nElements;
        };
        /**
         * Returns true if this tree contains the specified element.
         * @param {Object} element element to search for.
         * @return {boolean} true if this tree contains the specified element,
         * false otherwise.
         */
        BSTree.prototype.contains = function (element) {
            if (collections.isUndefined(element)) {
                return false;
            }
            return this.searchNode(this.root, element) !== null;
        };
        /**
         * Removes the specified element from this tree if it is present.
         * @return {boolean} true if this tree contained the specified element.
         */
        BSTree.prototype.remove = function (element) {
            var node = this.searchNode(this.root, element);
            if (node === null) {
                return false;
            }
            this.removeNode(node);
            this.nElements--;
            return true;
        };
        /**
         * Executes the provided function once for each element present in this tree in
         * in-order.
         * @param {function(Object):*} callback function to execute, it is invoked with one
         * argument: the element value, to break the iteration you can optionally return false.
         */
        BSTree.prototype.inorderTraversal = function (callback) {
            this.inorderTraversalAux(this.root, callback, {
                stop: false
            });
        };
        /**
         * Executes the provided function once for each element present in this tree in pre-order.
         * @param {function(Object):*} callback function to execute, it is invoked with one
         * argument: the element value, to break the iteration you can optionally return false.
         */
        BSTree.prototype.preorderTraversal = function (callback) {
            this.preorderTraversalAux(this.root, callback, {
                stop: false
            });
        };
        /**
         * Executes the provided function once for each element present in this tree in post-order.
         * @param {function(Object):*} callback function to execute, it is invoked with one
         * argument: the element value, to break the iteration you can optionally return false.
         */
        BSTree.prototype.postorderTraversal = function (callback) {
            this.postorderTraversalAux(this.root, callback, {
                stop: false
            });
        };
        /**
         * Executes the provided function once for each element present in this tree in
         * level-order.
         * @param {function(Object):*} callback function to execute, it is invoked with one
         * argument: the element value, to break the iteration you can optionally return false.
         */
        BSTree.prototype.levelTraversal = function (callback) {
            this.levelTraversalAux(this.root, callback);
        };
        /**
         * Returns the minimum element of this tree.
         * @return {*} the minimum element of this tree or undefined if this tree is
         * is empty.
         */
        BSTree.prototype.minimum = function () {
            if (this.isEmpty()) {
                return undefined;
            }
            return this.minimumAux(this.root).element;
        };
        /**
         * Returns the maximum element of this tree.
         * @return {*} the maximum element of this tree or undefined if this tree is
         * is empty.
         */
        BSTree.prototype.maximum = function () {
            if (this.isEmpty()) {
                return undefined;
            }
            return this.maximumAux(this.root).element;
        };
        /**
         * Executes the provided function once for each element present in this tree in inorder.
         * Equivalent to inorderTraversal.
         * @param {function(Object):*} callback function to execute, it is
         * invoked with one argument: the element value, to break the iteration you can
         * optionally return false.
         */
        BSTree.prototype.forEach = function (callback) {
            this.inorderTraversal(callback);
        };
        /**
         * Returns an array containing all of the elements in this tree in in-order.
         * @return {Array} an array containing all of the elements in this tree in in-order.
         */
        BSTree.prototype.toArray = function () {
            var array = [];
            this.inorderTraversal(function (element) {
                array.push(element);
                return true;
            });
            return array;
        };
        /**
         * Returns the height of this tree.
         * @return {number} the height of this tree or -1 if is empty.
         */
        BSTree.prototype.height = function () {
            return this.heightAux(this.root);
        };
        /**
        * @private
        */
        BSTree.prototype.searchNode = function (node, element) {
            var cmp = null;
            while (node !== null && cmp !== 0) {
                cmp = this.compare(element, node.element);
                if (cmp < 0) {
                    node = node.leftCh;
                }
                else if (cmp > 0) {
                    node = node.rightCh;
                }
            }
            return node;
        };
        /**
        * @private
        */
        BSTree.prototype.transplant = function (n1, n2) {
            if (n1.parent === null) {
                this.root = n2;
            }
            else if (n1 === n1.parent.leftCh) {
                n1.parent.leftCh = n2;
            }
            else {
                n1.parent.rightCh = n2;
            }
            if (n2 !== null) {
                n2.parent = n1.parent;
            }
        };
        /**
        * @private
        */
        BSTree.prototype.removeNode = function (node) {
            if (node.leftCh === null) {
                this.transplant(node, node.rightCh);
            }
            else if (node.rightCh === null) {
                this.transplant(node, node.leftCh);
            }
            else {
                var y = this.minimumAux(node.rightCh);
                if (y.parent !== node) {
                    this.transplant(y, y.rightCh);
                    y.rightCh = node.rightCh;
                    y.rightCh.parent = y;
                }
                this.transplant(node, y);
                y.leftCh = node.leftCh;
                y.leftCh.parent = y;
            }
        };
        /**
        * @private
        */
        BSTree.prototype.inorderTraversalAux = function (node, callback, signal) {
            if (node === null || signal.stop) {
                return;
            }
            this.inorderTraversalAux(node.leftCh, callback, signal);
            if (signal.stop) {
                return;
            }
            signal.stop = callback(node.element) === false;
            if (signal.stop) {
                return;
            }
            this.inorderTraversalAux(node.rightCh, callback, signal);
        };
        /**
        * @private
        */
        BSTree.prototype.levelTraversalAux = function (node, callback) {
            var queue = new Queue();
            if (node !== null) {
                queue.enqueue(node);
            }
            while (!queue.isEmpty()) {
                node = queue.dequeue();
                if (callback(node.element) === false) {
                    return;
                }
                if (node.leftCh !== null) {
                    queue.enqueue(node.leftCh);
                }
                if (node.rightCh !== null) {
                    queue.enqueue(node.rightCh);
                }
            }
        };
        /**
        * @private
        */
        BSTree.prototype.preorderTraversalAux = function (node, callback, signal) {
            if (node === null || signal.stop) {
                return;
            }
            signal.stop = callback(node.element) === false;
            if (signal.stop) {
                return;
            }
            this.preorderTraversalAux(node.leftCh, callback, signal);
            if (signal.stop) {
                return;
            }
            this.preorderTraversalAux(node.rightCh, callback, signal);
        };
        /**
        * @private
        */
        BSTree.prototype.postorderTraversalAux = function (node, callback, signal) {
            if (node === null || signal.stop) {
                return;
            }
            this.postorderTraversalAux(node.leftCh, callback, signal);
            if (signal.stop) {
                return;
            }
            this.postorderTraversalAux(node.rightCh, callback, signal);
            if (signal.stop) {
                return;
            }
            signal.stop = callback(node.element) === false;
        };
        /**
        * @private
        */
        BSTree.prototype.minimumAux = function (node) {
            while (node.leftCh !== null) {
                node = node.leftCh;
            }
            return node;
        };
        /**
        * @private
        */
        BSTree.prototype.maximumAux = function (node) {
            while (node.rightCh !== null) {
                node = node.rightCh;
            }
            return node;
        };
        /**
          * @private
          */
        BSTree.prototype.heightAux = function (node) {
            if (node === null) {
                return -1;
            }
            return Math.max(this.heightAux(node.leftCh), this.heightAux(node.rightCh)) + 1;
        };
        /*
        * @private
        */
        BSTree.prototype.insertNode = function (node) {
            var parent = null;
            var position = this.root;
            var cmp = null;
            while (position !== null) {
                cmp = this.compare(node.element, position.element);
                if (cmp === 0) {
                    return null;
                }
                else if (cmp < 0) {
                    parent = position;
                    position = position.leftCh;
                }
                else {
                    parent = position;
                    position = position.rightCh;
                }
            }
            node.parent = parent;
            if (parent === null) {
                // tree is empty
                this.root = node;
            }
            else if (this.compare(node.element, parent.element) < 0) {
                parent.leftCh = node;
            }
            else {
                parent.rightCh = node;
            }
            return node;
        };
        /**
        * @private
        */
        BSTree.prototype.createNode = function (element) {
            return {
                element: element,
                leftCh: null,
                rightCh: null,
                parent: null
            };
        };
        return BSTree;
    }());
    collections.BSTree = BSTree; // end of BSTree
})(collections || (collections = {})); // End of module 
///<reference path="lib/collections.ts"/>
///<reference path="lib/node.d.ts"/>
/** Graph module
*  Types for generic A\* implementation.
*/
/** An edge in a graph. */
var Edge = (function () {
    function Edge() {
    }
    return Edge;
}());
/** Type that reports the result of a search. */
var SearchResult = (function () {
    function SearchResult() {
    }
    return SearchResult;
}());
/**
* A\* search implementation, parameterised by a `Node` type.
*
* @param graph The graph on which to perform A\* search.
* @param start The initial node.
* @param goal A function that returns true when given a goal node. Used to determine if the algorithm has reached the goal.
* @param heuristics The heuristic function. Used to estimate the cost of reaching the goal from a given Node.
* @param timeout Maximum time (in seconds) to spend performing A\* search.
* @returns A search result, which contains the path from `start` to a node satisfying `goal` and the cost of this path.
*/
function aStarSearch(graph, start, goal, heuristics, timeout) {
    var dictHeuristics = new collections.Dictionary();
    // graph.compareNodes only checks if two nodes are the same, but we want to check the heuristics
    var comparer = function (a, b) {
        if (!dictHeuristics.containsKey(a))
            dictHeuristics.setValue(a, heuristics(a));
        if (!dictHeuristics.containsKey(b))
            dictHeuristics.setValue(b, heuristics(b));
        var aCost = costs.getValue(a) + dictHeuristics.getValue(a), bCost = costs.getValue(b) + dictHeuristics.getValue(b);
        return bCost - aCost;
    };
    var queue = new collections.PriorityQueue(comparer);
    var paths = new collections.Dictionary();
    var costs = new collections.Dictionary();
    queue.enqueue(start);
    costs.setValue(start, 0);
    var node;
    var startTime = Date.now();
    while (!queue.isEmpty()) {
        if (Date.now() - startTime >= timeout * 1000)
            throw ("aStarSearch timed out");
        node = queue.dequeue();
        if (goal(node))
            break;
        var nodeCost = costs.getValue(node);
        // check all the edges from this node and update their costs
        for (var _i = 0, _a = graph.outgoingEdges(node); _i < _a.length; _i++) {
            var edge = _a[_i];
            var newNode = edge.to;
            var newCost = nodeCost + edge.cost;
            if (!costs.containsKey(newNode) || newCost < costs.getValue(newNode)) {
                // the node has never been visited, or we have found a shorter path to it
                paths.setValue(newNode, node);
                costs.setValue(newNode, newCost);
                // costs must be updated before we enqueue because the comparer needs the new cost
                queue.enqueue(newNode);
            }
        }
    }
    if (!goal(node))
        return undefined; // no path
    var result = {
        path: [],
        cost: costs.getValue(node)
    };
    // node is equal to goal, traverse the links backwards to reconstruct the entire path  
    for (; node != start; node = paths.getValue(node))
        result.path.unshift(node);
    return result;
}
///<reference path="Graph.ts"/>
var GridNode = (function () {
    function GridNode(pos) {
        this.pos = pos;
    }
    GridNode.prototype.add = function (delta) {
        return new GridNode({
            x: this.pos.x + delta.x,
            y: this.pos.y + delta.y
        });
    };
    GridNode.prototype.compareTo = function (other) {
        return (this.pos.x - other.pos.x) || (this.pos.y - other.pos.y);
    };
    GridNode.prototype.toString = function () {
        return "(" + this.pos.x + "," + this.pos.y + ")";
    };
    return GridNode;
}());
var GridGraph = (function () {
    function GridGraph(size, obstacles) {
        this.size = size;
        this.walls = new collections.Set();
        for (var _i = 0, obstacles_1 = obstacles; _i < obstacles_1.length; _i++) {
            var pos = obstacles_1[_i];
            this.walls.add(new GridNode(pos));
        }
        for (var x = -1; x <= size.x; x++) {
            this.walls.add(new GridNode({ x: x, y: -1 }));
            this.walls.add(new GridNode({ x: x, y: size.y }));
        }
        for (var y = -1; y <= size.y; y++) {
            this.walls.add(new GridNode({ x: -1, y: y }));
            this.walls.add(new GridNode({ x: size.x, y: y }));
        }
    }
    GridGraph.prototype.outgoingEdges = function (node) {
        var outgoing = [];
        for (var dx = -1; dx <= 1; dx++) {
            for (var dy = -1; dy <= 1; dy++) {
                if (!(dx * dx == dy * dy)) {
                    var next = node.add({ x: dx, y: dy });
                    if (!this.walls.contains(next)) {
                        outgoing.push({
                            from: node,
                            to: next,
                            cost: 1
                        });
                    }
                }
            }
        }
        return outgoing;
    };
    GridGraph.prototype.compareNodes = function (a, b) {
        return a.compareTo(b);
    };
    GridGraph.prototype.toString = function (start, goal, path) {
        function pathContains(path, n) {
            for (var _i = 0, path_1 = path; _i < path_1.length; _i++) {
                var p = path_1[_i];
                if (p.pos.x == n.pos.x && p.pos.y == n.pos.y)
                    return true;
            }
            return false;
        }
        var str = "";
        for (var y = this.size.y - 1; y >= 0; y--) {
            // row of borders
            for (var x = 0; x < this.size.x; x++) {
                if (y == this.size.y ||
                    this.walls.contains(new GridNode({ x: x, y: y })) ||
                    this.walls.contains(new GridNode({ x: x, y: y + 1 })))
                    str += "+---";
                else
                    str += "+   ";
            }
            str += "+\n";
            // row of cells
            for (var x = 0; x < this.size.x; x++) {
                var xynode = new GridNode({ x: x, y: y });
                // the wall between cells
                if (x == 0 || this.walls.contains(xynode) ||
                    this.walls.contains(new GridNode({ x: x - 1, y: y })))
                    str += "|";
                else
                    str += " ";
                // the cell
                if (start && x == start.pos.x && y == start.pos.y)
                    str += " S ";
                else if (goal && goal(xynode))
                    str += " G ";
                else if (path && pathContains(path, xynode))
                    str += " O ";
                else if (this.walls.contains(xynode))
                    str += "###";
                else
                    str += "   ";
            }
            str += "|\n";
        }
        str += new Array(this.size.x + 1).join("+---") + "+\n";
        return str;
    };
    return GridGraph;
}());
///<reference path="World.ts"/>
///<reference path="Interpreter.ts"/>
///<reference path="Graph.ts"/>
///<reference path="GridGraph.ts"/>
/**
 * Planner module
 *
 * The goal of the Planner module is to take the interpetation(s)
 * produced by the Interpreter module and to plan a sequence of actions
 * for the robot to put the world into a state compatible with the
 * user's command, i.e. to achieve what the user wanted.
 *
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
     * The core of the Planner
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
        var graph = new PGraph(state.objects);
        var startNode = new PNode(state.stacks, state.holding, state.arm, null);
        var goalFun = function (node) { return goal(interpretation, node); };
        var heuristicsFun = function (node) { return heuristics(interpretation, node); };
        var timeout = 5;
        var aStar = aStarSearch(graph, startNode, goalFun, heuristicsFun, timeout);
        if (!aStar)
            throw ("that's impossible");
        var plan = [];
        // Recreate the sequence of actions taken to get to the goal.
        for (var _i = 0, _a = aStar.path; _i < _a.length; _i++) {
            var node = _a[_i];
            plan.push(node.action);
        }
        return plan;
    }
})(Planner || (Planner = {}));
/**
 * goal function
 * Tests if the PNode, which represents a state in the world, is the goal state. This is done by
 * checking that the state fullfils the conditions provided by the logical interpretation.
 * @param interpretation The logical interpretation of the user's desired goal.
 * @param n A PNode which contains the current state of the world.
 * @returns A boolean which determines whether the current state of the world is the goal state.
 */
function goal(interpretation, n) {
    for (var i = 0; i < interpretation.length; i++) {
        var condSatisfied = true;
        for (var j = 0; j < interpretation[i].length; j++) {
            var condition = interpretation[i][j];
            var firstArg = condition.args[0]; // Get the first object.
            if (condition.relation === "holding") {
                if (n.holding !== firstArg) {
                    condSatisfied = false; // The arm is not holding the specified object.
                    break;
                }
            }
            else {
                var secArg = condition.args[1]; // Get second object.
                if (n.holding === firstArg || n.holding === secArg) {
                    condSatisfied = false; // If the arm holds any of the argument objects the condition is not satified, given that the relation is not holding.
                    break;
                }
                var firstCord = findIndex(firstArg, n.stacks); // Get the coordinate of the first argument object.
                if (secArg === "floor") {
                    switch (condition.relation) {
                        case "ontop":
                            if (firstCord.y !== 0)
                                condSatisfied = false; // Check if an object is not on the floor
                            break;
                        case "above":
                            break;
                    }
                }
                else {
                    var secCord = findIndex(secArg, n.stacks); // Get coordinate of second argument object.
                    switch (condition.relation) {
                        case "leftof":
                            /* Is the first object right of the second object? */
                            if (firstCord.x >= secCord.x)
                                condSatisfied = false;
                            break;
                        case "rightof":
                            /* Is the first object left of the second object? */
                            if (firstCord.x <= secCord.x)
                                condSatisfied = false;
                            break;
                        case "above":
                            /* Are the objects not at the same X-Coordinate or is the first object under the second object? */
                            if (firstCord.x !== secCord.x || firstCord.y <= secCord.y)
                                condSatisfied = false;
                            break;
                        case "under":
                            /* Are the objects not at the same X-Coordinate or is the first object above the second object?  */
                            if (firstCord.x !== secCord.x || firstCord.y >= secCord.y)
                                condSatisfied = false;
                            break;
                        case "beside":
                            /* Is the X-distance between the objects equal to 1?  */
                            if (Math.abs(firstCord.x - secCord.x) !== 1)
                                condSatisfied = false;
                            break;
                        case "ontop":
                        case "inside":
                            /* Are the objects not at the same X-Coordinate or is the Y-distance not equal to 1?  */
                            if (firstCord.x !== secCord.x || firstCord.y - secCord.y !== 1)
                                condSatisfied = false;
                            break;
                    }
                }
            }
        }
        // If all conditions are satisfied in the DNFFormula we have found a solution.
        if (condSatisfied)
            return true;
    }
    return false;
}
/**
 * heuristics function
 * Given a PNode (state) and the DNFFormula determines how far the given state is from the goal.
 * @param ors The logical interpretation of the user's desired goal.
 * @param node The PNode (state) that you want to check.
 * @returns An integer which represents the distance from the given state to the goal state.
 */
function heuristics(ors, node) {
    var min = Infinity;
    for (var _i = 0, ors_1 = ors; _i < ors_1.length; _i++) {
        var ands = ors_1[_i];
        var andMin = 0;
        for (var _a = 0, ands_1 = ands; _a < ands_1.length; _a++) {
            var and = ands_1[_a];
            switch (and.relation) {
                case "holding":
                    if (node.holding === and.args[0]) {
                    }
                    else {
                        var srcCoord = findIndex(and.args[0], node.stacks);
                        if (node.holding !== null)
                            andMin++; // drop whatever it is we're holding
                        andMin += Math.abs(node.arm - srcCoord.x); // move the arm above src
                        andMin++; // pick
                    }
                    break;
                default:
                    if (node.holding === and.args[0]) {
                        if (and.args[1] === "floor") {
                            //TODO find nearest empty stack
                            andMin++; // drop
                        }
                        else {
                            var dstCoord = findIndex(and.args[1], node.stacks);
                            andMin += Math.abs(dstCoord.x - node.arm); // move the arm above dst
                            andMin++; // drop
                        }
                    }
                    else if (node.holding === and.args[1]) {
                        var srcCoord = findIndex(and.args[0], node.stacks);
                        var dstCoord = { x: node.arm, y: node.stacks[node.arm].length };
                        andMin++; // drop dst
                        andMin += Math.abs(node.arm - srcCoord.x); // move the arm above src
                        andMin++; // pickup
                        andMin += Math.abs(dstCoord.x - srcCoord.x); // move the arm above dst
                        andMin++; // drop
                    }
                    else {
                        if (node.holding !== null)
                            andMin++; // drop whatever it is we're holding
                        var srcCoord = findIndex(and.args[0], node.stacks);
                        andMin += Math.abs(node.arm - srcCoord.x); // move the arm above src
                        andMin++; // pickup
                        if (and.args[1] === "floor") {
                            //TODO find nearest empty stack
                            andMin++; // move to adjacent stack
                            andMin++; // drop
                        }
                        else {
                            var dstCoord = findIndex(and.args[1], node.stacks);
                            andMin += Math.abs(dstCoord.x - srcCoord.x); // move the arm above dst
                            andMin++; // drop
                        }
                    }
                    break;
            }
        }
        min = Math.min(min, andMin);
    }
    return min;
}
/**
 * function findIndex
 * Finds the Coordinate for the position of the object in the world.
 * @param obj The object you want to find the Coordinate for.
 * @param stacks The stack.
 * @returns Coordinate of the object in the world.
*/
function findIndex(obj, stacks) {
    var coordinate = undefined;
    for (var i = 0; i < stacks.length; i++) {
        for (var j = 0; j < stacks[i].length; j++) {
            if (stacks[i][j] === obj) {
                return { x: i, y: j };
            }
        }
    }
    throw ("no index for " + obj);
}
/**
 * PGraph class
 * A Graph which contains PNodes (states). Used in combination with the aStarSearch.
 */
var PGraph = (function () {
    function PGraph(objects) {
        this.objects = objects;
        // This is never used in our aStarSearch implementation.
        this.compareNodes = function (a, b) {
            return undefined;
        };
    } // All objects in the world.
    PGraph.prototype.outgoingEdges = function (node) {
        // Caution: Don't create side-effects when creating new states. 
        var edges = [];
        if (node.arm > 0) {
            var left = new PNode(node.stacks, node.holding, node.arm, "l");
            left.arm--;
            edges.push({ from: node, to: left, cost: 1 });
        }
        if (node.arm < node.stacks.length - 1) {
            var right = new PNode(node.stacks, node.holding, node.arm, "r");
            right.arm++;
            edges.push({ from: node, to: right, cost: 1 });
        }
        if (node.holding === null && node.stacks[node.arm].length) {
            var pick = new PNode(node.stacks.slice(), node.holding, node.arm, "p");
            pick.stacks[pick.arm] = pick.stacks[pick.arm].slice();
            pick.holding = pick.stacks[pick.arm].pop();
            edges.push({ from: node, to: pick, cost: 1 });
        }
        if (node.holding !== null && node.stacks[node.arm].length < node.stacks.length) {
            var physicsOk = node.stacks[node.arm].length === 0;
            if (!physicsOk) {
                var srcId = node.holding;
                var srcObj = this.objects[srcId];
                var dstId = node.stacks[node.arm][node.stacks[node.arm].length - 1];
                var dstObj = this.objects[dstId];
                var relation = dstObj.form === "box" ? "inside" : "ontop";
                physicsOk = Interpreter.checkPhysics(srcId, srcObj, relation, dstId, dstObj);
            }
            if (physicsOk) {
                var drop = new PNode(node.stacks.slice(), node.holding, node.arm, "d");
                drop.stacks[drop.arm] = drop.stacks[drop.arm].slice();
                drop.stacks[drop.arm].push(drop.holding);
                drop.holding = null;
                edges.push({ from: node, to: drop, cost: 1 });
            }
        }
        return edges;
    };
    return PGraph;
}());
/** class PNode
 * A node which represents a state in the world.
 */
var PNode = (function () {
    function PNode(stacks, // The stack.
        holding, // Which object the arm is currently holding.
        arm, // The X-Coordinate of the arm.
        action // Which actions was taken to get to this state i.e "d", "r", "l" or "p"
        ) {
        var _this = this;
        this.stacks = stacks;
        this.holding = holding;
        this.arm = arm;
        this.action = action;
        /* Because the string representation of any object is obviously [Object object] */
        this.toString = function () { return JSON.stringify(_this); };
    }
    return PNode;
}());
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
///<reference path="Shrdlite.ts"/>
///<reference path="TextWorld.ts"/>
///<reference path="ExampleWorlds.ts"/>
// Extract command line arguments:
var nodename = process.argv[0];
var jsfile = process.argv[1].replace(/^.*\//, "");
var worldname = process.argv[2];
var utterance = process.argv[3];
var usage = "Usage: " + nodename + " " + jsfile +
    " (" + Object.keys(ExampleWorlds).join(" | ") + ")" +
    " (utterance | example no.)";
if (process.argv.length != 4 || !ExampleWorlds[worldname]) {
    console.error(usage);
    process.exit(1);
}
var world = new TextWorld(ExampleWorlds[worldname]);
var example = parseInt(utterance);
if (!isNaN(example)) {
    utterance = world.currentState.examples[example];
    if (!utterance) {
        console.error("Error: Cannot find example no. " + example);
        process.exit(1);
    }
}
world.printWorld(function () {
    var plan = Shrdlite.parseUtteranceIntoPlan(world, utterance);
    console.log();
    world.performPlan(plan, function () {
        world.printWorld();
    });
});
