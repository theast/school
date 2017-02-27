import CPP.Absyn.*;
import java.util.*;

public class TypeChecker {

    public void typecheck(Program p) {
        Env environment = new Env();
        environment.addStdFunctions();
        p.accept(new ProgramVisitor(), environment);
    }

    public class ProgramVisitor implements Program.Visitor<Object, Env> {
        public Object visit(PDefs p, Env environment){
            for (Def v : p.listdef_)
                v.accept(new DefinitionInitFinder(), environment);

            for (Def v : p.listdef_)
                v.accept(new DefinitionVisitor(), environment);
            return null;
        }
    }

    public class DefinitionInitFinder implements Def.Visitor<Object, Env> {
        public Object visit(DFun p, Env environment) {
            environment.functions.put(p.id_, p);
            return environment;
        }
    }

    public class DefinitionVisitor implements Def.Visitor<Object, Env> {
        public Object visit(DFun p, Env environment) {
            environment.createEnvironment();

            LinkedList<Type> argTypeList = new LinkedList<Type>();
            for (Arg a : p.listarg_)
                argTypeList.add(a.accept(new ArgVisitor(), environment));

            environment.addVar("return", p.type_);

            for (Stm stm : p.liststm_)
                stm.accept(new StatementVisitor(), environment);

            environment.removeEnvironment();
            return environment;
        }
    }

    public class StatementVisitor implements Stm.Visitor<Env, Env> {
        public Env visit(SExp p, Env environment) {
            p.exp_.accept(new ExpVisitor(), environment);
            return null;
        }

        public Env visit(SDecls p, Env environment) {
            for (String id : p.listid_)
                environment.addVar(id, p.type_);
            return null;
        }

        public Env visit(SInit p, Env environment) {
            Type code = p.exp_.accept(new ExpVisitor(), environment);

            if (code.equals(p.type_)) {
                environment.addVar(p.id_, p.type_);
                p.exp_.accept(new ExpVisitor(), environment);
            } else {
                throw new TypeException("Types does not match!");
            }

            return null;
        }

        public Env visit(SReturn p, Env environment) {
            Type code = p.exp_.accept(new ExpVisitor(), environment);
            if (!(code.equals(environment.lookVar("return"))))
                throw new TypeException("Return types does not match");
            return null;
        }

        public Env visit(SWhile p, Env environment) {
            Type code = p.exp_.accept(new ExpVisitor(), environment);
            if (!(code instanceof Type_bool))
                throw new TypeException("Arg to while must be a bool");
            p.stm_.accept(this, environment);
            return null;
        }

        public Env visit(SBlock p, Env environment) {
            environment.createEnvironment();
            for (Stm stm : p.liststm_)
                stm.accept(this, environment);
            environment.removeEnvironment();
            return null;
        }

        public Env visit(SIfElse p, Env environment) {
            Type code = p.exp_.accept(new ExpVisitor(), environment);
            if (!(code instanceof Type_bool))
                throw new TypeException("Arg to IfElse must be a bool");
            p.stm_1.accept(this, environment);
            p.stm_2.accept(this, environment);
            return null;
        }
    }

    public class ExpVisitor implements Exp.Visitor<Type, Env> {

        public Type visit(ETrue p, Env environment) { return new Type_bool(); }
        public Type visit(EFalse p, Env environment) { return new Type_bool(); }
        public Type visit(EInt p, Env environment) { return new Type_int(); }
        public Type visit(EDouble p, Env environment) { return new Type_double(); }
        public Type visit(EId p, Env environment) { return environment.lookVar(p.id_); }

        public Type visit(EApp p, Env environment) {
            DFun fun = environment.functions.get(p.id_);

            if (p.listexp_.size() != fun.listarg_.size())
                throw new TypeException("Number of arguments does not match!");

            for (Exp exp : p.listexp_)
                exp.accept(this, environment);
            return fun.type_;
        }

        public Type visit(EPostIncr p, Env environment) {
            return incdec("++", p.exp_.accept(this, environment));
        }

        public Type visit(EPostDecr p, Env environment) {
            return incdec("--", p.exp_.accept(this, environment));
        }

        public Type visit(EPreIncr p, Env environment) {
            return incdec("pre ++", p.exp_.accept(this, environment));
        }

        public Type visit(EPreDecr p, Env environment) {
            return incdec("pre --", p.exp_.accept(this, environment));
        }

        public Type visit(ETimes p, Env environment) {
            return arithmetic("*", p.exp_1.accept(this, environment), p.exp_2.accept(this, environment));
        }

        public Type visit(EDiv p, Env environment) {
            return arithmetic("/", p.exp_1.accept(this, environment), p.exp_2.accept(this, environment));
        }

        public Type visit(EPlus p, Env environment) {
            return arithmetic("+", p.exp_1.accept(this, environment), p.exp_2.accept(this, environment));
        }

        public Type visit(EMinus p, Env environment) {
            return arithmetic("-", p.exp_1.accept(this, environment), p.exp_2.accept(this, environment));
        }

        public Type visit(ELt p, Env environment) {
            Type code1 = p.exp_1.accept(this, environment);
            Type code2 = p.exp_2.accept(this, environment);
            if (mustBeSameType(code1, code2)) {
                return cantBeVoid("Lt", code1, code2);
            } else {
                throw new TypeException("Must be of same type!");
            }
        }

        public Type visit(EGt p, Env environment) {
            Type code1 = p.exp_1.accept(this, environment);
            Type code2 = p.exp_2.accept(this, environment);
            if (mustBeSameType(code1, code2)) {
                return cantBeVoid("Gt", code1, code2);
            } else {
                throw new TypeException("Must be of same type!");
            }
        }

        public Type visit(ELtEq p, Env environment) {
            Type code1 = p.exp_1.accept(this, environment);
            Type code2 = p.exp_2.accept(this, environment);
            if (mustBeSameType(code1, code2)) {
                return cantBeVoid("LtEq", code1, code2);
            } else {
                throw new TypeException("Must be of same type!");
            }
        }

        public Type visit(EGtEq p, Env environment) {
            Type code1 = p.exp_1.accept(this, environment);
            Type code2 = p.exp_2.accept(this, environment);
            if (mustBeSameType(code1, code2)) {
                return cantBeVoid("GtEq", code1, code2);
            } else {
                throw new TypeException("Must be of same type!");
            }
        }

        public Type visit(EEq p, Env environment) {
            Type code1 = p.exp_1.accept(this, environment);
            Type code2 = p.exp_2.accept(this, environment);
            if (mustBeSameType(code1, code2)) {
                return cantBeVoid("Eq", code1, code2);
            } else {
                throw new TypeException("Must be of same type!");
            }
        }

        public Type visit(ENEq p, Env environment) {
            Type code1 = p.exp_1.accept(this, environment);
            Type code2 = p.exp_2.accept(this, environment);
            if (mustBeSameType(code1, code2)) {
                return cantBeVoid("NEq", code1, code2);
            } else {
                throw new TypeException("Must be of same type!");
            }
        }

        public Type visit(EAnd p, Env environment) {
            return mustBeBoolean("And", p.exp_1.accept(this, environment), p.exp_2.accept(this, environment));
        }

        public Type visit(EOr p, Env environment) {
            return mustBeBoolean("Or", p.exp_1.accept(this, environment), p.exp_2.accept(this, environment));
        }

        public Type visit(EAss p, Env environment) {
            Type code1 = environment.lookVar(p.id_);

            if (code1.equals(p.exp_.accept(this, environment))) {
                return code1;
            } else {
                throw new TypeException("To use opperand Ass both variables must have same type");
            }
        }

        public Type incdec(String operand, Type code){
            if (code instanceof Type_int){
                return new Type_int();
            } else if (code instanceof Type_double){
                return new Type_double();
            }

            throw new TypeException("To use opperand " + operand + " type must either be Integer or Double");
        }

        public Type arithmetic(String operand, Type code1, Type code2){
            if (code1 instanceof Type_int && code2 instanceof Type_int){
                return new Type_int();
            } else if (code1 instanceof Type_double && code2 instanceof Type_double){
                return new Type_double();
            } else {
                throw new TypeException("To use opperand " + operand + " type must either be Integer or Double");
            }
        }

        public Type cantBeVoid(String operand, Type code1, Type code2) {
            if (!(code1 instanceof  Type_void) || !(code2 instanceof Type_void)){
                return new Type_bool();
            } else {
                throw new TypeException("To use opperand " + operand + " type can't be void");
            }
        }

        public Type mustBeBoolean(String opperand, Type code1, Type code2){

            if (code1 instanceof Type_bool && code2 instanceof Type_bool){
                return new Type_bool();
            } else {
                throw new TypeException("To use opperand " + opperand + " type must be boolean");
            }

        }

        public boolean mustBeSameType(Type code1, Type code2){
            return code1.equals(code2);
        }
    }

    public class Env {
        public LinkedList<HashMap<String, Type>> contexts = new LinkedList<HashMap<String, Type>>();
        public HashMap<String, DFun> functions = new HashMap<String, DFun>();

        public void addStdFunctions(){

            Stm printX = new Stm() {
                public <R,A> R accept(Stm.Visitor<R,A> v, A arg) {
                    return null;
                }
            };
            Stm readInt = new Stm() {
                public <R,A> R accept(Stm.Visitor<R,A> v, A arg) {
                    return null;
                }
            };
            Stm readDouble = new Stm() {
                public <R,A> R accept(Stm.Visitor<R,A> v, A arg) {
                    return null;
                }
            };

            functions.put("printInt",
                    new DFun(new Type_void(),
                            "printInt",
                            listArg(new ADecl(new Type_int(), "x")),
                            listStm(printX)));

            functions.put("printDouble",
                    new DFun(new Type_void(),
                            "printDouble",
                            listArg(new ADecl(new Type_int(), "x")),
                            listStm(printX)));

            functions.put("readInt",
                    new DFun(new Type_int(),
                            "readInt",
                            listArg(null),
                            listStm(readInt)));

            functions.put("readDouble",
                    new DFun(new Type_double(),
                            "readDouble",
                            listArg(null),
                            listStm(readDouble)));
        }

        public ListArg listArg(ADecl arg) {
            ListArg listArg = new ListArg();
            if (arg != null)
                listArg.add(arg);
            return listArg;
        }

        public ListStm listStm(Stm stm) {
            ListStm listStm = new ListStm();
            listStm.add(stm);
            return listStm;
        }

        public Type lookVar(String id) {
            for (HashMap<String, Type> hashMap : contexts) {
                Type code = hashMap.get(id);
                if (code != null)
                    return code;
            }
            throw new TypeException("Variable " + id + " is not defined" );
        }

        public void addVar(String id, Type typeCode) {
            if (contexts.getFirst().containsKey(id)) {
                throw new TypeException("Variable " + id + " already defined");
            } else {
                contexts.getFirst().put(id, typeCode);
            }
        }

        public void createEnvironment(){ contexts.addFirst(new HashMap<String, Type>()); }

        public void removeEnvironment(){ contexts.pop(); }
    }

    public class ArgVisitor implements Arg.Visitor<Type, Env> {
        public Type visit(ADecl p, Env environment) {
            environment.addVar(p.id_, p.type_);
            return p.type_;
        }
    }
}

