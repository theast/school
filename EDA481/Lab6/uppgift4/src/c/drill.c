#include "../../../src/c/ports.h"
#include "../../../uppgift3/src/c/clock.h"
#include "drill.h"

port8 DCShadow;

void init_drill() {
	init_clock();
	DCShadow = 0;
	write8(DRILLCONTROL, 0);
}

void MotorStart() {
	if(DCShadow & 1 << 2)
		return;
	Outone(2);
	hold((time_type)1000);
}

void MotorStop() {
	Outzero(2);
}

void DrillDown() {
	Outone(3);
}

void DrillUp() {
	Outzero(3);
}

void Alarm(int n) {
	if(n > 0)
		while(1) {
			Outone(4);
			hold((time_type)1000);
			Outzero(4);
			if(--n == 0)
				return;
			hold((time_type)500);
		}
}

int Step() {
	if(!(read8(DRILLSTATUS) & 1 << 1)) {
		Alarm(3);
		return 0;
	}
	Outone(1);
	Outone(0);
	hold((time_type)500);
	Outzero(0);
	Outzero(1);
	return 1;
}

int NStep(int n) {
	Outone(1);
	for(; n > 0; n--) {
		if(!(read8(DRILLSTATUS) & 1 << 1)) {
			Alarm(3);
			Outzero(1);
			return 0;
		}
		Outone(0);
		hold((time_type)500);
		Outzero(0);
	}
	Outzero(1);
	return 1;
}

int DrillDownTest(int down) {
	unsigned char i;
	down = down ? 1 << 2 : 1 << 1;
	for(i = 20; i > 0 && !(read8(DRILLSTATUS) & down); i--)
		hold((time_type)250);
	if(i == 0 && !(read8(DRILLSTATUS) & down)) {
		Alarm(2);
		return 0;
	}
	return 1;
}

int DrillHole() {
	DrillDown();
	if(!DrillDownTest(1))
		return 0;
	DrillUp();
	if(!DrillDownTest(0))
		return 0;
	return 1;
}

int ToRefPos() {
	while(!(read8(DRILLSTATUS) & 1 << 0))
		if(!Step())
			return 0;
	return 1;
}

void DrillAuto(unsigned char pattern[]) {
	unsigned short i = 0;
	if(!ToRefPos())
		return;
	MotorStart();
	for(; pattern[i] != 0xFF; i++)
		if(!NStep(pattern[i]) || !DrillHole())
			break;
	MotorStop();
}

void Outzero(int bit) {
	if(bit < 0 || bit > 7)
		return;
	DCShadow &= ~(1 << bit);
	write8(DRILLCONTROL, DCShadow);
}

void Outone(int bit) {
	if(bit < 0 || bit > 7)
		return;
	DCShadow |= 1 << bit;
	write8(DRILLCONTROL, DCShadow);
}
