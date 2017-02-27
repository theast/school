#include "clock.h"
#include "../../../src/c/ports.h"

#ifdef SIMULATOR
	#define RTR 0x10
	#define DIV 100
#else
	#define RTR 0x10 //TODO
	#define DIV 10
#endif

time_type counter;

void init_clock() {
	counter = 0;
	write8(CRGINT, read8(CRGINT) | 0x80);
	write8(CRGFLG, 0x80);
	write8(RTICTL, read8(RTICTL) | RTR);
	IRQ_VEC = irq;
	CRG_VEC = irq; //Wat
	_init_irq();
}

void clock_inter() {
	counter++;
	write8(CRGFLG, 0x80);
}

time_type get_time() {
	return counter * DIV;
}

void hold(time_type ms) {
	ms = counter + (ms / DIV);
	while(counter < ms);
}
