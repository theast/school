#include "../../../src/c/ports.h"
#include "keyboardML15.h"
#include "displayML15.h"

void main() {
	while(1)
		display_dec(get_key());

}
