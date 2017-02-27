#include "../../../src/c/ports.h"
#include "displayML15.h"

void display_digits(unsigned char digits[]) {
	unsigned char i;
	write8(ML15DMR, 1);
	write8(ML15DDR, 0x80);
	write8(ML15DMR, 0);
	for(i = 0; i < 6; i++)
		write8(ML15DDR, digits[i]);
	write8(ML15DDR, 0);
	write8(ML15DDR, 0);
}

void display_dec(unsigned int dec) {
	unsigned char digits[6];
	signed char i;
	for(i = 5; i >= 0; i--, dec /= 10)
		digits[i] = dec % 10;
	display_digits(digits);
}
