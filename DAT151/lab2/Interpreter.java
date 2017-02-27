import CPP.Absyn.*;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.Scanner;

public class Interpreter {

    public void interpret(Program p) {
        Env environment = new Env();
        environment.addStdFunctions();
        p.accept(new ProgramVisitor(), environment);
    }

    public class ProgramVisitor implements Program.Visitor<Object, Env> {
        public Object visit(PDefs p, Env environment) {
            for (Def v : p.listdef_)
                v.accept(new DefinitionInitFinder(), environment);
            environment.functions.get("main").accept(new DefinitionVisitor(), environment);
            return environment;
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
            for (Arg arg : p.listarg_)
                environment.addVar(arg.accept(new ArgVisitor(), null));

            for (Stm stm : p.liststm_) {
                if (stm.accept(new StatementVisitor(), environment) != null)
                    break;
            }
            environment.removeEnvironment();
            return environment;
        }
    }

    public class StatementVisitor implements Stm.Visitor<Value, Env> {

        public Value visit(SExp p, Env environment) {
            p.exp_.accept(new ExpVisitor(), environment);
            return null;
        }

        public Value visit(SDecls p, Env environment) {
            for (String id : p.listid_)
                environment.addVar(id);
            return null;
        }

        public Value visit(SInit p, Env environment) {
            environment.addVar(p.id_);
            environment.setVar(p.id_, p.exp_.accept(new ExpVisitor(), environment));
            return null;
        }

        public Value visit(SReturn p, Env environment) {
            return p.exp_.accept(new ExpVisitor(), environment);
        }

        public Value visit(SWhile p, Env environment) {
            Value value = null;
            while (p.exp_.accept(new ExpVisitor(), environment).getInt() != 0) {
                value = p.stm_.accept(this, environment);
                if (value != null)
                    break;
            }
            return value;
        }

        public Value visit(SBlock p, Env environment) {
            environment.createEnvironment();
            Value value = null;
            for (Stm stm : p.liststm_){
                value = stm.accept(this, environment);
                if (value != null)
                    break;
            }
            environment.removeEnvironment();
            return value;
        }

        public Value visit(SIfElse p, Env environment) {
            Value value;
            if (p.exp_.accept(new ExpVisitor(), environment).getInt() == 1)
                value = p.stm_1.accept(this, environment);
            else
                value = p.stm_2.accept(this, environment);
            return value;
        }
    }

    public class ExpVisitor implements Exp.Visitor<Value, Env> {

        public Value visit(ETrue p, Env environment) {
            return new Value<Integer>(1);
        }

        public Value visit(EFalse p, Env environment) {
            return new Value<Integer>(0);
        }

        public Value visit(EInt p, Env environment) {
            return new Value<Integer>(p.integer_);
        }

        public Value visit(EDouble p, Env environment) {
            return new Value<Double>(p.double_);
        }

        public Value visit(EId p, Env environment) {
            return environment.lookVar(p.id_);
        }

        public Value visit(EApp p, Env environment) {
            DFun fun = environment.functions.get(p.id_);

            LinkedList<Value> values = new LinkedList<Value>();
            for (Exp exp : p.listexp_)
                values.add(exp.accept(this, environment));

            environment.createEnvironment();
            for (int i = 0; i < fun.listarg_.size(); i++) {
                environment.addVar(fun.listarg_.get(i).accept(new ArgVisitor(), null));
                environment.setVar(fun.listarg_.get(i).accept(new ArgVisitor(), null), values.get(i));
            }

            for (Stm stm : fun.liststm_){
                Value value = stm.accept(new StatementVisitor(), environment);
                if (value != null){
                    environment.removeEnvironment();
                    return value;
                }
            }

            environment.removeEnvironment();

            if(fun.type_ instanceof Type_void)
                return null;

            throw new RuntimeException("no return statment");
        }

        public Value visit(EPostIncr p, Env environment) {
            Value value = p.exp_.accept(this, environment);
            if (value.isInt()){
                environment.setVar(((EId) p.exp_).id_, new Value<Integer>(value.getInt() + 1));
                return new Value<Integer>(value.getInt());
            } else {
                environment.setVar(((EId) p.exp_).id_, new Value<Double>(value.getDouble() + 1));
                return new Value<Double>(value.getDouble());
            }
        }

        public Value visit(EPostDecr p, Env environment) {
            Value value = p.exp_.accept(this, environment);
            if (value.isInt()){
                environment.setVar(((EId) p.exp_).id_, new Value<Integer>(value.getInt() - 1));
                return new Value<Integer>(value.getInt());
            } else {
                environment.setVar(((EId) p.exp_).id_, new Value<Double>(value.getDouble() - 1));
                return new Value<Double>(value.getDouble());
            }
        }

        public Value visit(EPreIncr p, Env environment) {
            Value value = p.exp_.accept(this, environment);
            if (value.isInt()){
                environment.setVar(((EId) p.exp_).id_, new Value<Integer>(value.getInt() + 1));
                return new Value<Integer>(value.getInt() + 1);
            } else {
                environment.setVar(((EId) p.exp_).id_, new Value<Double>(value.getDouble() + 1));
                return new Value<Double>(value.getDouble() + 1);
            }
        }

        public Value visit(EPreDecr p, Env environment) {
            Value value = p.exp_.accept(this, environment);
            if (value.isInt()){
                environment.setVar(((EId) p.exp_).id_, new Value<Integer>(value.getInt() - 1));
                return new Value<Integer>(value.getInt() - 1);
            } else {
                environment.setVar(((EId) p.exp_).id_, new Value<Double>(value.getDouble() - 1));
                return new Value<Double>(value.getDouble() - 1);
            }
        }

        public Value visit(ETimes p, Env environment) {
            Value value1 = p.exp_1.accept(this, environment);
            Value value2 = p.exp_2.accept(this, environment);
            if (value1.isInt() && value2.isInt()){
                return new Value<Integer>(value1.getInt() * value2.getInt());
            } else {
                return new Value<Double>(value1.getDouble() * value2.getDouble());
            }
        }

        public Value visit(EDiv p, Env environment) {
            Value value1 = p.exp_1.accept(this, environment);
            Value value2 = p.exp_2.accept(this, environment);
            if (value1.isInt() && value2.isInt()){
                return new Value<Integer>(value1.getInt() / value2.getInt());
            } else {
                return new Value<Double>(value1.getDouble() / value2.getDouble());
            }
        }

        public Value visit(EPlus p, Env environment) {
            Value value1 = p.exp_1.accept(this, environment);
            Value value2 = p.exp_2.accept(this, environment);
            if (value1.isInt() && value2.isInt()){
                return new Value<Integer>(value1.getInt() + value2.getInt());
            } else {
                return new Value<Double>(value1.getDouble() + value2.getDouble());
            }
        }

        public Value visit(EMinus p, Env environment) {
            Value value1 = p.exp_1.accept(this, environment);
            Value value2 = p.exp_2.accept(this, environment);
            if (value1.isInt() && value2.isInt()){
                return new Value<Integer>(value1.getInt() - value2.getInt());
            } else {
                return new Value<Double>(value1.getDouble() - value2.getDouble());
            }
        }

        public Value visit(ELt p, Env environment) {
            Value value1 = p.exp_1.accept(this, environment);
            Value value2 = p.exp_2.accept(this, environment);
            if (value1.isInt() && value2.isInt()){
                return new Value<Integer>((value1.getInt() < value2.getInt()) ? 1 : 0);
            } else {
                return new Value<Integer>((value1.getDouble() < value2.getDouble()) ? 1 : 0);
            }
        }

        public Value visit(EGt p, Env environment) {
            Value value1 = p.exp_1.accept(this, environment);
            Value value2 = p.exp_2.accept(this, environment);
            if (value1.isInt() && value2.isInt()){
                return new Value<Integer>((value1.getInt() > value2.getInt()) ? 1 : 0);
            } else {
                return new Value<Integer>((value1.getDouble() > value2.getDouble()) ? 1 : 0);
            }
        }

        public Value visit(ELtEq p, Env environment) {
            Value value1 = p.exp_1.accept(this, environment);
            Value value2 = p.exp_2.accept(this, environment);
            if (value1.isInt() && value2.isInt()){
                return new Value<Integer>((value1.getInt() <= value2.getInt()) ? 1 : 0);
            } else {
                return new Value<Integer>((value1.getDouble() <= value2.getDouble()) ? 1 : 0);
            }
        }

        public Value visit(EGtEq p, Env environment) {
            Value value1 = p.exp_1.accept(this, environment);
            Value value2 = p.exp_2.accept(this, environment);
            if (value1.isInt() && value2.isInt()){
                return new Value<Integer>((value1.getInt() >= value2.getInt()) ? 1 : 0);
            } else {
                return new Value<Integer>((value1.getDouble() >= value2.getDouble()) ? 1 : 0);
            }
        }

        public Value visit(EEq p, Env environment) {
            Value value1 = p.exp_1.accept(this, environment);
            Value value2 = p.exp_2.accept(this, environment);

            if (value1.isInt() && value2.isInt()){
                return new Value<Integer>((value1.getInt().equals(value2.getInt())) ? 1 : 0);
            } else {
                return new Value<Integer>((value1.getDouble().equals(value2.getDouble())) ? 1 : 0);
            }
        }

        public Value visit(ENEq p, Env environment) {
            Value value1 = p.exp_1.accept(this, environment);
            Value value2 = p.exp_2.accept(this, environment);
            if (value1.isInt() && value2.isInt()){
                return new Value<Integer>(!(value1.getInt().equals(value2.getInt())) ? 1 : 0);
            } else {
                return new Value<Integer>(!(value1.getDouble().equals(value2.getDouble())) ? 1 : 0);
            }
        }

        public Value visit(EAnd p, Env environment) {
            Value value1 = p.exp_1.accept(this, environment);
            if (value1.getInt() == 0)
                return new Value<Integer>(0);
            else {
                Value value2 = p.exp_2.accept(this, environment);
                if (value2.getInt() == 0)
                    return new Value<Integer>(0);
            }
            return new Value<Integer>(1);
        }

        public Value visit(EOr p, Env environment) {
            Value value1 = p.exp_1.accept(this, environment);
            if (value1.getInt() == 1)
                return new Value<Integer>(1);
            else {
                Value value2 = p.exp_2.accept(this, environment);
                if (value2.getInt() == 1)
                    return new Value<Integer>(1);
            }
            return new Value<Integer>(0);
        }

        public Value visit(EAss p, Env environment) {
            Value value = p.exp_.accept(this, environment);
            environment.setVar(p.id_, value);
            return value;
        }
    }

    public class Env {
        public HashMap<String, DFun> functions = new HashMap<String, DFun>();
        public LinkedList<HashMap<String,Value>> contexts = new LinkedList<HashMap<String, Value>>();
        public Scanner scanner = new Scanner(System.in);

        public void addStdFunctions(){

            Stm printX = new Stm() {
                public <R,A> R accept(Stm.Visitor<R,A> v, A arg) {
                    System.out.println(lookVar("x"));
                    return null;
                }
            };
            Stm readInt = new Stm() {
                public <R,A> R accept(Stm.Visitor<R,A> v, A arg) {
                    int i = scanner.nextInt();
                    return (R) new Value<Integer>(i);
                }
            };
            Stm readDouble = new Stm() {
                public <R,A> R accept(Stm.Visitor<R,A> v, A arg) {
                    double d = scanner.nextDouble();
                    return (R) new Value<Double>(d);
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

        public void addVar(String id){
            contexts.getFirst().put(id, null);
        }

        public boolean setVar(String id, Value value){
            for (int i = 0; i < contexts.size(); i++) {
                if (contexts.get(i).containsKey(id)) {
                    contexts.get(i).put(id, value);
                    return true;
                }
            }
            throw new RuntimeException("Variable " + id + " does not exist in enivornment");
        }

        public Value lookVar(String id){
            for (HashMap<String, Value> hashMap : contexts){
                if (hashMap.containsKey(id)) {
                    return hashMap.get(id);
                }
            }
            throw new RuntimeException("Variable does not exists");
        }

        public void createEnvironment() {
            contexts.addFirst(new HashMap<String, Value>());
        }

        public void removeEnvironment(){
            contexts.pop();
        }
    }

    public class ArgVisitor implements Arg.Visitor<String, Env> {
        public String visit(ADecl p, Env environment) {
            return p.id_;
        }
    }

    private class Value<R> {
        private R value;

        public Value(R value){
            this.value = value;
        }

        public Integer getInt(){
            return (Integer) value;
        }

        public Double getDouble(){
            return (Double) value;
        }

        public boolean isInt() {
            return value instanceof Integer;
        }

        public String toString() {
            return value.toString();
        }
    }
}


