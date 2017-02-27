import java.util.concurrent.*;

public class sharedResourceProblem {
	private Thread[] philosophers;
	private Semaphore[] chopsticks;


	public static void main(String[] args){
		new sharedResourceProblem(10);
	}

	public sharedResourceProblem(int amount){
		philosophers = new Thread[amount];
		chopsticks = new Semaphore[amount];
		for (int i = 0; i < amount; i++){
			chopsticks[i] = new Semaphore(1, true);
		}
		for (int i = 0; i < amount; i++){
			philosophers[i] = new Thread(new Philosopher(i, amount));
			philosophers[i].start();
		}
	}

	public class Philosopher implements Runnable {
		private int id;
		private int howManyPhilosophers;

		public Philosopher(int id, int howManyPhilosophers){
			this.id = id;
			this.howManyPhilosophers = howManyPhilosophers;
		}

		public void run() {
			int left = id;
			int right = (id+1) % howManyPhilosophers;

			while (true){
				System.out.println("Philisopher "+id+" is thinking");
				try { Thread.sleep(500+(int)(Math.random()*1000)) ;}
				catch (InterruptedException e) {} ;

				// BREAK THE SYMMETRY, FOR THE FIRST PHILOSOPHER TAKES RIGHT CHOPSTICK FIRST.
				if (id == 0){
					try { 
						chopsticks[right].acquire() ; 
						chopsticks[left].acquire() ; 
					} catch (InterruptedException e) {} 

					System.out.println("Philosopher" + id + " is eating..");
					try { Thread.sleep(1000+(int)(Math.random()*1000)) ;}
					catch (InterruptedException e) {} ;

					chopsticks[right].release();
					chopsticks[left].release();
				}
				else {
					try { 
						chopsticks[left].acquire() ; 
						chopsticks[right].acquire() ; 
					} catch (InterruptedException e) {} 

					System.out.println("Philosopher" + id + " is eating..");
					try { Thread.sleep(1000+(int)(Math.random()*1000)) ;}
					catch (InterruptedException e) {} ;

					chopsticks[left].release();
					chopsticks[right].release();
				}
			}
		}
	}
}
