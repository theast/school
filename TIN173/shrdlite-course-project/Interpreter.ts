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
module Interpreter {

    //////////////////////////////////////////////////////////////////////
    // exported functions, classes and interfaces/types

/**
Top-level function for the Interpreter. It calls `interpretCommand` for each possible parse of the command. No need to change this one.
* @param parses List of parses produced by the Parser.
* @param currentState The current state of the world.
* @returns Augments ParseResult with a list of interpretations. Each interpretation is represented by a list of Literals.
*/    
    export function interpret(parses : Parser.ParseResult[], currentState : WorldState) : InterpretationResult[] {
        var errors : Error[] = [];
        var interpretations : InterpretationResult[] = [];
        parses.forEach((parseresult) => {
            try {
                var result : InterpretationResult = <InterpretationResult>parseresult;
                result.interpretation = interpretCommand(result.parse, currentState);
                interpretations.push(result);
            } catch(err) {
                errors.push(err);
            }
        });
        if (interpretations.length) {
            return interpretations;
        } else {
            // only throw the first error found
            throw errors[0];
        }
    }

    export interface InterpretationResult extends Parser.ParseResult {
        interpretation : DNFFormula;
    }

    export type DNFFormula = Conjunction[];
    type Conjunction = Literal[];

    /**
    * A Literal represents a relation that is intended to
    * hold among some objects.
    */
    export interface Literal {
	/** Whether this literal asserts the relation should hold
	 * (true polarity) or not (false polarity). For example, we
	 * can specify that "a" should *not* be on top of "b" by the
	 * literal {polarity: false, relation: "ontop", args:
	 * ["a","b"]}.
	 */
        polarity : boolean;
	/** The name of the relation in question. */
        relation : string;
	/** The arguments to the relation. Usually these will be either objects 
     * or special strings such as "floor" or "floor-N" (where N is a column) */
        args : string[];
    }

    export function stringify(result : InterpretationResult) : string {
        return result.interpretation.map((literals) => {
            return literals.map((lit) => stringifyLiteral(lit)).join(" & ");
            // return literals.map(stringifyLiteral).join(" & ");
        }).join(" | ");
    }

    export function stringifyLiteral(lit : Literal) : string {
        return (lit.polarity ? "" : "-") + lit.relation + "(" + lit.args.join(",") + ")";
    }

    //////////////////////////////////////////////////////////////////////
    // private functions
    /**
     * The core interpretation function.
     * @param cmd The actual command. Note that it is *not* a string, but rather an object of type `Command` (as it has been parsed by the parser).
     * @param state The current state of the world. Useful to look up objects in the world.
     * @returns A list of list of Literal, representing a formula in disjunctive normal form (disjunction of conjunctions). See the dummy interpetation returned in the code for an example, which means ontop(a,floor) AND holding(b).
     */
    function interpretCommand(cmd : Parser.Command, state : WorldState) : DNFFormula {
        if(cmd.command === "move" || cmd.command === "take") {
            // special checks that only is meaningful on the subject of the command
            var srcQuantifier : string = cmd.entity.quantifier;
            var srcObj : Parser.Object = cmd.entity.object.location === undefined ? cmd.entity.object : cmd.entity.object.object;
            if(srcObj.form === "floor")
                throw "'" + cmd.command + " the floor' does not make sense"
        }
        if(cmd.command === "move") {
            var relation : string      = cmd.location.relation;
            var dstQuantifier : string = cmd.location.entity.quantifier;
            var dstObj : Parser.Object  = cmd.location.entity.object.location === undefined ? cmd.location.entity.object : cmd.location.entity.object.object;
            checkRelationInUtterence(srcQuantifier, srcObj, relation, dstQuantifier, dstObj);
        }

        // Top level utterence seems ok, lets go recursive
        var subss : ObjectRef[][];
        if(cmd.command === "put") {
            // we want manipulate the object in the arm
            if(state.holding === null)
                throw "we aren't holding anything";
            // this will break, eventually
            subss = [[{objId: state.holding}]];
        } else {
            // figure out what objects we want to manipulate
            subss = findEntities(cmd.entity, state);
        }

        var ors : DNFFormula = [];
        if(cmd.command === "take") {
            // the object should end up in our arm
            if(cmd.entity.quantifier === "all")
                throw "we can't pick up more than one object";
            for(var subs of subss)
                ors.push([{polarity: true, relation: "holding", args: [subs[0].objId]}]);
        } else {
            // this is combination hell
            // we probably should just rewrite all of this,
            // but it have already given me enough headache
            var destss : ObjectRef[][] = findEntities(cmd.location.entity, state);
            if(subss.length > 1) {
                // subss is an array of single element arrays: [[a],[b],[c]]
                for(var subs of subss) {
                    if(!subs.length)
                        continue;
                    var combine = combineOneToAll(cmd.location.relation, subs[0], destss, state);
                    if(combine.length)
                        ors = ors.concat(combine);
                }
            } else if(subss[0].length) {
                // subss is an array of a single array: [[a, b, c]]
                if(destss.length > 1) {
                    // destss is an array of single element arrays: [[a],[b],[c]]
                    ors = combineAllToOne(cmd.location.relation, subss[0], destss.map(a => a[0]), state);
                } else if(destss[0].length) {
                    // subss is an array of a single array: [[a, b, c]]
                    ors.push(combineAllToAll(cmd.location.relation, subss[0], destss[0], state))
                }
            }
        }
        if(!ors.length)
            throw "unable to interpret";
        return ors;
    }

    /**
     * combineOneToAll function
     * Combines the quantifiers "any/the" with "all"
     * @param relation The relation that the entities should share.
     * @param left The first arguments in the relation.
     * @param rightss A DNFFormula of the second argument in the relation.
     * @param state The WorldState
     * @returns A DNFFormula
     */
    function combineOneToAll(relation : string, left : ObjectRef, rightss : ObjectRef[][], state : WorldState) : DNFFormula {
        var ors : DNFFormula = [];
        var src_objId = left.objId;
        var src_obj = state.objects[src_objId];
        for(var rights of rightss) {
            var ands : Conjunction = [];
            for(var right of rights) {
                var dest_objId = right.objId;
                var dest_obj = state.objects[dest_objId];
                if(checkPhysics(src_objId, src_obj, relation, dest_objId, dest_obj))
                    ands.push({polarity: true, relation: relation, args: [src_objId, dest_objId]});
            }
            if(ands.length)
                ors.push(ands);
        }
        return ors;
    }

    /** 
     * combineAllToOne function
     * Combines the quantifier "all" with "any/the". 
     * @param relation The relations that the entities should share.
     * @param lefts A conjunction of the first arguments in the relation.
     * @param rights A disjunction of the second argument in the relation. 
     * @param state The WorldState
     * @returns A DNFFormula
     */
    function combineAllToOne(relation : string, lefts : ObjectRef[], rights : ObjectRef[], state : WorldState) : DNFFormula {
        var ors : DNFFormula = [];
        if(lefts.length === 1) {
            var src_objId = lefts[0].objId;
            var src_obj = state.objects[src_objId];
            for(var right of rights) {
                var dst_objId = right.objId;
                var dst_obj = state.objects[dst_objId];
                if(checkPhysics(src_objId, src_obj, relation, dst_objId, dst_obj))
                    ors.push([{polarity: true, relation: relation, args: [src_objId, dst_objId]}]);
            }
        } else if(rights.length === 1) {
            var and : Conjunction = [];
            var dst_objId = rights[0].objId;
            var dst_obj = state.objects[dst_objId];
            for(var left of lefts) {
                var src_objId = left.objId;
                var src_obj = state.objects[src_objId];
                if(checkPhysics(src_objId, src_obj, relation, dst_objId, dst_obj))
                    and.push({polarity: true, relation: relation, args: [src_objId, dst_objId]});
            }
            if(and.length)
                ors.push(and);
        } else {
            var left : ObjectRef = lefts.pop();
            for(var i : number = rights.length-1; i >= 0; i--) {
                var l : ObjectRef[] = lefts.slice();
                var r : ObjectRef[] = rights.slice();
                var right : ObjectRef = r.splice(i, 1)[0];
                var dnf : DNFFormula = combineAllToOne(relation, l, r, state);
                if(checkPhysics(left.objId, state.objects[left.objId], relation, right.objId, state.objects[right.objId]))
                    for(var or of dnf)
                        or.push({polarity: true, relation: relation, args: [left.objId, right.objId]});
                if(dnf.length)
                    ors = ors.concat(dnf);
            }
        }
        return ors;
    }

    /**
     * Combines "put all balls beside all boxes"
     * @param relation The relation that the entities should share
     * @param lefts A conjunction of the first arguments of the relation
     * @param rights A conjunction of the second arguments of the relation
     * @param state The WorldState
     * @return A conjunction of all combinations between lefts and rights
     */
    function combineAllToAll(relation : string, lefts : ObjectRef[], rights : ObjectRef[], state : WorldState) : Conjunction {
        var ands : Conjunction = [];
        for(var left of lefts) {
            for(var right of rights) {
                ands.push({polarity: true, relation: relation, args: [left.objId, right.objId]});
            }
        }
        return ands;
    }

    export function checkPhysics(srcId : string, srcObj : ObjectDefinition,
                          relation : string, dstId : string,
                          dstObj : ObjectDefinition) : boolean {
        if(srcId === dstId)
            return false;
        if(dstObj === undefined) // not an object, probably "floor"
            return true;
        if(srcObj.form === "floor")
            return false;
        switch(relation) {
            case "inside":
                //Objects are “inside” boxes, but “ontop” of other objects.
                if(dstObj.form !== "box") 
                    return false;
                //Small objects cannot support large objects.
                if(srcObj.size === "large" && dstObj.size === "small") 
                    return false;
                //Boxes cannot contain pyramids, planks or boxes of the same size
                if((srcObj.form === "pyramid" || srcObj.form === "plank" || srcObj.form === "box") && dstObj.form === "box" && srcObj.size === dstObj.size) 
                    return false;
                break;
            case "ontop":
                //Objects are “inside” boxes, but “ontop” of other objects.
                if(dstObj.form === "box") 																													
                    return false;
                //Can't have anything ontop of a ball
                if(dstObj.form === "ball") 																													
                    return false;
                //Small objects cannot support large objects.
                if(srcObj.size === "large" && dstObj.size === "small")																						
                    return false;
                //Balls must be in boxes or on the floor, otherwise they roll away.
                if(srcObj.form === "ball" && dstObj.form !== "floor")	                        															
                    return false;
                //Small boxes cannot be supported by small bricks or pyramids.
                if(srcObj.size === "small" && srcObj.form === "box" && dstObj.size === "small" && (dstObj.form === "pyramid" || dstObj.form === "plank"))   
                    return false;
                //Large boxes cannot be supported by large pyramids.
                if(srcObj.size === "large" && srcObj.form === "box" && dstObj.size === "large" && dstObj.form === "pyramid")   								
                    return false;
                break;
            case "under":
                //Can't have anything under the floor 
                if(dstObj.form === "floor")
                    return false;
                //Can't have a small object under a large object
                if(dstObj.size === "large" && srcObj.size === "small")
                    return false;
                //Balls must have floor or box under itself
                if(dstObj.form === "ball" && srcObj.form !== "floor" && srcObj.form !== "box")
                    return false;
                break;
            case "beside":
                // Object cant be beside floor
                if(dstObj.form === "floor")
                    return false;
                break;
        }
        return true;
    }

    interface ObjectRef {
        objId : string,
        // if stack and posInStack is not present then the object doesn't really have a position, like "floor"
        stack? : number, posInStack? : number
    }

    /**
     * findEntities function
     * Finds all entities that matches the description of the given entity.
     * @param entity The description of the entity to find.
     * @param state Tbe WorldState.
     * @returns returns all entites that matches the description.
     */
    function findEntities(entity : Parser.Entity, state : WorldState) : ObjectRef[][] {
        if(entity.object.location !== undefined) {
            // there are more restrictions
            var orTests : ObjectPositionTest[][] = findLocations(entity.quantifier, entity.object.object, entity.object.location, state);
            var objs  : ObjectRef[]     = findObjects(entity.object.object, state);
            var validObjs : ObjectRef[] = objs.filter(
                obj => orTests.some(
                    ands => ands.every(
                        test => test.test(obj))));
            return checkQuantifier(entity.quantifier, validObjs);
        } else {
            // entity.object describes what entities we want to find
            var objs : ObjectRef[] = findObjects(entity.object, state);
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
    function checkQuantifier(quantifier : string, entities : ObjectRef[]) : ObjectRef[][] {
        switch(quantifier) {
            case "the":
                if(entities.length > 1) // there can't be more than one "the"
                    throw "\"the\" is ambigous";
                return [entities];
            case "any":
                return entities.map(x => [x]);
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
    function findObjects(objectDesc : Parser.Object, state : WorldState) : ObjectRef[] {
        var entities : ObjectRef[] = [];
        if(objectDesc.form === "floor") {
            // so for some reason the parser thinks that "small blue floor" is an ok utterance
            // that's all good, except that the floor can't have a size or color...
            if(objectDesc.size !== null || objectDesc.color !== null) {
                throw("the floor can't have a size or color");
            }
            entities.push({objId: "floor"});
            return entities;
        }
        if(state.holding !== null && testObject(state.holding, objectDesc, state))
            entities.push({objId: state.holding});
        for(var stackIndex = 0; stackIndex < state.stacks.length; stackIndex++) {
            var stack : Stack = state.stacks[stackIndex];
            for(var objIndex = 0; objIndex < stack.length; objIndex++) {
                var objId : string = stack[objIndex];
                if(testObject(objId, objectDesc, state))
                   entities.push({objId: objId, stack: stackIndex, posInStack: objIndex});
            }
        }
        return entities;
    }
    
    /**
     * Tests if a real object matches a description
     * @param objId The ID of the object to be tested
     * @param objectDesc The description
     * @param state The WorldState
     */
    function testObject(objId : string, objectDesc : Parser.Object, state : WorldState) : boolean {
        var object : ObjectDefinition = state.objects[objId];
        var form  : boolean = objectDesc.form  === null || objectDesc.form  === "anyform" || objectDesc.form  === object.form;
        var size  : boolean = objectDesc.size  === null || objectDesc.size  === object.size;
        var color : boolean = objectDesc.color === null || objectDesc.color === object.color;
        return form && size && color;
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
    function checkRelationInUtterence(srcQuantifier : string, srcObj : Parser.Object,
                                      relation : string,
                                      dstQuantifier : string, dstObj : Parser.Object) : void {
        // floor is special
        if(dstObj.form === "floor") {
            if(relation !== "above" && relation !== "ontop")
                throw("'" + relation + " floor' does not make sense");
        }
        // check for relation/form
        switch(relation) {
            case "inside":
                if(dstObj.form !== "box")
                    throw("\"inside " + dstObj.form + "\" does not make sense");
                break;
            case "ontop":
                if(dstObj.form === "ball")
                    throw("you can not put objects on balls") // Balls cannot support anything.
                break;
        }
        // check for relation/quantity
        switch(relation) {
            case "inside":
            case "ontop":
                switch(srcQuantifier) {
                    case "the":
                    case "any":
                        if(dstQuantifier === "all")
                            throw("\"" + srcQuantifier + " ... " + relation + " all\" doesn't make sense");
                        break;
                    case "all":
                        if(dstQuantifier === "the" && dstObj.form !== "floor")
                            throw("\"all ... " + relation + " the\" doesn't make sense");
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
    function findLocations(srcQuantifier : string, srcObj : Parser.Object,
                           location : Parser.Location, state : WorldState) : ObjectPositionTest[][] {
        var dstQuantifier : string = location.entity.quantifier;
        var dstObj : Parser.Object;
        if(location.entity.object.location === undefined)
            dstObj = location.entity.object;
        else
            dstObj = location.entity.object.object;
        checkRelationInUtterence(srcQuantifier, srcObj, location.relation, dstQuantifier, dstObj);

        var testFun : (x : ObjectRef, refPos : ObjectRef) => boolean;

        // Each relation should use the proper function.
        switch(location.relation){
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

        var refss : ObjectRef[][] = findEntities(location.entity, state);
        var refTestss : ObjectPositionTest[][] = [];
        for(var refs of refss) {
            var refTests : ObjectPositionTest[] = [];
            for(var ref of refs)
                refTests.push(new ObjectPositionTest(ref, testFun));
            refTestss.push(refTests);
        }
        return refTestss;
    }

    /**
     * ObjectPositionTest class
     * A test that is relative a given object. 
     */
    class ObjectPositionTest {
        constructor(
            private refPos : ObjectRef,
            public testFun : (x : ObjectRef, refPos : ObjectRef) => boolean
        ) {}

        test(x : ObjectRef) : boolean {
            return this.testFun(x, this.refPos);
        }
    }

    // The following functions are used with ObjectPositionTest
    
    // Checks if an object is leftof another object.
    function leftof(x : ObjectRef, refPos : ObjectRef) : boolean {
        if(refPos.stack === undefined) {
            return false;
        } else {
            return x.stack < refPos.stack;
        }
    }

    // Checks if an object is rightof another object.
    function rightof(x : ObjectRef, refPos : ObjectRef) : boolean {
        if(refPos.stack === undefined) {
            return false;
        } else {
            return x.stack > refPos.stack;
        }
    }

    // Checks if an object is ontop of another object.
    function ontop(x : ObjectRef, refPos : ObjectRef) : boolean {
        if(refPos.stack === undefined) {
            switch(refPos.objId) {
                case "floor":
                    return x.posInStack === 0;
            }
            return false;
        } else {
            return x.stack === refPos.stack && x.posInStack === refPos.posInStack + 1;
        }
    }

    // Checks if an object is under another object.
    function under(x : ObjectRef, refPos : ObjectRef) : boolean {
        if(refPos.stack === undefined) {
            return false;
        } else {
            return x.stack === refPos.stack && x.posInStack < refPos.posInStack;
        }
    }

    // Checks if an object is beside another object.
    function beside(x : ObjectRef, refPos : ObjectRef) : boolean {
        if(refPos.stack === undefined) {
            return false;
        } else {
            return Math.abs(x.stack - refPos.stack) === 1;
        }
    }

    // Checks if an object is above another object.
    function above(x : ObjectRef, refPos : ObjectRef) : boolean {
        if(refPos.stack === undefined) {
            switch(refPos.objId) {
                case "floor":
                    return true;
            }
            return false;
        } else {
            return x.stack === refPos.stack && x.posInStack > refPos.posInStack;
        }
    }

}

