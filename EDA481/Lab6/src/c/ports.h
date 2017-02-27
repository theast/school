#define SIMULATOR

typedef unsigned char port8;
typedef port8 *port8ptr;
typedef unsigned short port16;
typedef port16 *port16ptr;
typedef unsigned long port32;
typedef port32 *port32ptr;

#define write8(adr, val)	*((port8ptr) adr) = (port8) val;
#define write16(adr, val)	*((port16ptr) adr) = (port16) val;
#define write32(adr, val)	*((port32ptr) adr) = (port32) val;
#define read8(adr)		*((port8ptr) adr)
#define read16(adr)		*((port16ptr) adr)
#define read32(adr)		*((port32ptr) adr)

#define ML4IN	0x0600
#define ML4OUT	0x0400

typedef void (*vec) (void);
typedef vec *vecptr;
#define IRQ_VEC_ADR	0x3FF2
#define IRQ_VEC		*((vecptr) IRQ_VEC_ADR)
#define CRG_VEC_ADR	0x3FF0
#define CRG_VEC		*((vecptr) CRG_VEC_ADR)

#define DRILLCONTROL	0x400
#ifdef SIMULATOR
	#define	DRILLSTATUS 	0x401
#else
	#define DRILLSTATUS 	0x600
#endif

#define	ML15KDR		0x09C0
#define	ML15DMR		0x09C2
#define	ML15DDR		0x09C3

#define CRG		0x0034
#define CRGFLG		(CRG+0x03)
#define CRGINT		(CRG+0x04)
#define RTICTL		(CRG+0x07)

