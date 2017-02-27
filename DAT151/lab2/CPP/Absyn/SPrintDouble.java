package CPP.Absyn; // Java Package generated by the BNF Converter.

public class SPrintDouble extends Stm {
  public final Exp exp_;
  public SPrintDouble(Exp p1) { exp_ = p1; }

  public <R,A> R accept(CPP.Absyn.Stm.Visitor<R,A> v, A arg) { return v.visit(this, arg); }

  public boolean equals(Object o) {
    if (this == o) return true;
    if (o instanceof CPP.Absyn.SPrintDouble) {
      CPP.Absyn.SPrintDouble x = (CPP.Absyn.SPrintDouble)o;
      return this.exp_.equals(x.exp_);
    }
    return false;
  }

  public int hashCode() {
    return this.exp_.hashCode();
  }


}