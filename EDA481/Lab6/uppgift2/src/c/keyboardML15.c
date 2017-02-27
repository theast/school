#include "../../../src/c/ports.h"
#include "keyboardML15.h"

unsigned char get_key() {
	port8 data;
	while((data = read8(ML15KDR)) >= 0x80);
	while((data = read8(ML15KDR)) < 0x80);
	return data & ~(0x80);
}
