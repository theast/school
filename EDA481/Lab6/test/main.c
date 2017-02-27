typedef unsigned char *port8ptr;
typedef unsigned short *port16ptr;

#define ML4OUT_ADR 0x400
#define ML4IN_ADR1 0x600
#define ML4IN_ADR2 0x601

#define ML4OUT16 *((port16ptr) ML4OUT_ADR)
#define ML4IN1 *((port8ptr) ML4IN_ADR1)
#define ML4IN2 *((port8ptr) ML4IN_ADR2)

void main() {
	while(1) {
		ML4OUT16 = ML4IN1 + ML4IN2;
	}
}
