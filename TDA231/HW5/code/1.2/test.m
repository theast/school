H = [ 8   8  -4 -4;
      8   16 -8  0;
     -4  -8   4  0;
     -4   0   0 4];
 
f = [-1; -1; -1; -1];
 
A = [-1  0  0  0;
      0 -1  0  0;
      0  0 -1  0;
      0  0  0 -1];
 
b = [0; 0; 0; 0];
 
Aeq = [1 1 -1 -1];
 
beq = 0;
 
x = quadprog(H,f,A,b,Aeq,beq)