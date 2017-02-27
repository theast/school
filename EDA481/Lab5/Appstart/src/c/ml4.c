#define ML4IN	0x0600
#define ML4OUT	0x0400

#define ML4READ		*((char *) ML4IN)
#define ML4WRITE	*((char *) ML4OUT)

void main() {
	char c;
	c = ML4READ;
	c = c << 1;
	ML4WRITE = c;
}
