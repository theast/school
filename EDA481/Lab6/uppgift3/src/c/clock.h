typedef unsigned long int time_type;

void irq();
void _init_irq();

void init_clock();
void clock_inter();
time_type get_time();
void hold(time_type);
