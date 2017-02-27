#include "../../../src/c/ports.h"
#include "../../../uppgift2/src/c/keyboardML15.h"
#include "drill.h"

const unsigned char pattern[] = {
	0x00,0x01,0x01,0x01,0x01,0x01,0x01,
	0x01,0x02,0x01,0x05,0x02,0x02,0x02,
	0x02,0x04,0x04,0x03,0x08,0x02,0xFF
};

void main() {
	init_drill();
	while(1) {
		switch(get_key()) {
			case 0: MotorStart(); break;
			case 1: MotorStop(); break;
			case 2: DrillUp(); break;
			case 3: DrillDown(); break;
			case 4: Step(); break;
			case 5: DrillHole(); break;
			case 6: ToRefPos(); break;
			case 7: DrillAuto(pattern); break;
			default: break;
		}
	}
}
