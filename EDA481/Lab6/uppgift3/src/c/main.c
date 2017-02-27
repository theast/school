#include "../../../src/c/ports.h"
#include "../../../uppgift2/src/c/keyboardML15.h"
#include "../../../uppgift2/src/c/displayML15.h"
#include "clock.h"

void main() {
	init_clock();
	while(1)
		display_dec((unsigned int)(get_time() / 1000));

}
