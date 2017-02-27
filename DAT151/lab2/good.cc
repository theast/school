/* Test arithmetic and comparisons. */

int main(int a) {
    int x = 56;
    int y = 23;
    printInt(x+y);
    printInt(x-y);
    printInt(x*y);
    printInt(45/2);
    double z = 9.3;
    printInt(x*y);
    double w = 5.1;
    printInt(x*y);
    printBool(z+w > z-w);
    printInt(x*y);
    printBool(z/w <= z*w);
    printInt(x*y);
    return 0 ;
}

void printBool(bool b) {
  if (b) {
  } else {
  }
}

//void printInt(int x) { }
//void printDouble(double x) { }
