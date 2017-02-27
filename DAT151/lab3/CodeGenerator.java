import CPP.Absyn.*;

import java.util.HashMap;
import java.util.LinkedList;

public class CodeGenerator {

    private Env environment;

    public void generateCode(Program p) {
        environment = new Env();
        PDefs defs = (PDefs) p;

        LinkedList<Type> args = new LinkedList<Type>();
        args.add(new Type_int());
        environment.updateFun("printInt", new FunType("runtime/printInt", args, new Type_void()));

        for (Def def : defs.listdef_){
            DFun dFun = (DFun) def;
            generateStms(dFun.liststm_);
        }
    }

    public void generateStms(ListStm listStm){
        for (Stm stm : listStm){
            generateStm(stm);
        }
    }

    public void generateExp(Exp exp){
        exp.accept(new ExpGenerator(), null);
    }

    public void generateStm(Stm stm){
        stm.accept(new StmGenerator(), null);
    }

    public class StmGenerator implements Stm.Visitor<Object, Object> {

        public Object visit(SExp p, Object arg) {
            generateExp(p.exp_);
            emit("pop");
            return null;
        }

        public Object visit(SDecls p, Object arg) {
            return null;
        }

        public Object visit(SInit p, Object arg) {
            return null;
        }

        public Object visit(SReturn p, Object arg) {
            return null;
        }

        public Object visit(SWhile p, Object arg) {
            return null;
        }

        public Object visit(SBlock p, Object arg) {
            return null;
        }

        public Object visit(SIfElse p, Object arg) {
            return null;
        }
    }

    public class ExpGenerator implements Exp.Visitor<Object, Object> {

        public Object visit(ETrue p, Object arg) {
            return null;
        }

        public Object visit(EFalse p, Object arg) {
            return null;
        }

        public Object visit(EInt p, Object arg) {
            return null;
        }

        public Object visit(EDouble p, Object arg) {
            return null;
        }

        public Object visit(EId p, Object arg) {
            return null;
        }

        public Object visit(EApp p, Object arg) {
            for (Exp exp : p.listexp_){
                generateExp(exp);
            }

            FunType funType = environment.lookUpFun(p.id_);
            emit("invokestatic " + funType.javaRef + jvmFunType(funType));

            switch (typeCode(funType.outtyp)){
                case VOID:
                    emit("bipush 0"); break;
            }

            return null;
        }

        public Object visit(EPostIncr p, Object arg) {
            return null;
        }

        public Object visit(EPostDecr p, Object arg) {
            return null;
        }

        public Object visit(EPreIncr p, Object arg) {
            return null;
        }

        public Object visit(EPreDecr p, Object arg) {
            return null;
        }

        public Object visit(ETimes p, Object arg) {
            return null;
        }

        public Object visit(EDiv p, Object arg) {
            return null;
        }

        public Object visit(EPlus p, Object arg) {
            p.exp_1.accept(this, null);
            p.exp_2.accept(this, null);
            emit("iadd");
            return null;
        }

        public Object visit(EMinus p, Object arg) {
            return null;
        }

        public Object visit(ELt p, Object arg) {
            return null;
        }

        public Object visit(EGt p, Object arg) {
            return null;
        }

        public Object visit(ELtEq p, Object arg) {
            return null;
        }

        public Object visit(EGtEq p, Object arg) {
            return null;
        }

        public Object visit(EEq p, Object arg) {
            return null;
        }

        public Object visit(ENEq p, Object arg) {
            return null;
        }

        public Object visit(EAnd p, Object arg) {
            return null;
        }

        public Object visit(EOr p, Object arg) {
            return null;
        }

        public Object visit(EAss p, Object arg) {
            return null;
        }
    }

    public enum TypeCode {
        INT,
        DOUBLE,
        BOOL,
        VOID
    }

    public String jvmFunType(FunType funType){
        TypeCode code = typeCode(funType.outtyp);
        switch (code){
            case INT:
                return "I";
            case DOUBLE:
                return "D";
            case BOOL:
                return "B";
            default:
                return "V";
        }
    }

    public TypeCode typeCode(Type type) {
        return type.accept(new TypeVisitor(), null);
    }

    public class TypeVisitor implements Type.Visitor<TypeCode, Object> {
        public TypeCode visit(Type_bool p, Object arg) {
            return TypeCode.BOOL;
        }

        public TypeCode visit(Type_int p, Object arg) {
            return TypeCode.INT;
        }

        public TypeCode visit(Type_double p, Object arg) {
            return TypeCode.DOUBLE;
        }

        public TypeCode visit(Type_void p, Object arg) {
            return TypeCode.VOID;
        }
    }

    public class FunType {
        public String javaRef;
        public LinkedList<Type> intyps;
        public Type outtyp;

        public FunType(String javaRef, LinkedList<Type> intyps, Type outtyp){
            this.javaRef = javaRef;
            this.intyps = intyps;
            this.outtyp = outtyp;
        }
    }

    public class Env {
        public HashMap<String, FunType> signature = new HashMap<String, FunType>();
        public TypeCode returnType;

        public void updateFun(String id, FunType funType){
            signature.put(id, funType);
        }
        public FunType lookUpFun(String id) {
            return signature.get(id);
        }
    }

    public void emit(String instruction){
        System.out.println(instruction);
    }
}

