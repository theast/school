import java.util.Random;
import java.util.concurrent.*;

public class newBarberProblem {

	private Semaphore chair1 = new Semaphore(1, true);
	private Semaphore chair2 = new Semaphore(1, true);
	private Thread[] customers;
	private Thread barber1;
	private Thread barber2;
	private Thread barber3;
	private Barber b1;
	private Barber b2;
	private Barber b3;

	public newBarberProblem(int antalKunder){	
		b1 = new Barber(1);
		b2 = new Barber(2);
		b3 = new Barber(3);

		barber1 = new Thread(b1);
		barber2 = new Thread(b2);
		barber3 = new Thread(b3);
		barber1.start();
		barber2.start();
		barber3.start();
		
		customers = new Thread[antalKunder];

		for (int i = 0; i < antalKunder; i++){
			customers[i] = new Thread(new Customer(i));
			customers[i].start();
		}
	}

	public static void main(String[] args){
		new newBarberProblem(10);
	}

	public class Customer implements Runnable {
		Semaphore hasBeenhasBeenCut = new Semaphore(0, true);
		int id;
		
		public Customer(int id){
			this.id = id;
		}

		public void acquire(Semaphore a){
			try {
				a.acquire();
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}

		public void run() {
			int barber = id % 3;
			int hasBeendone = 0;
			
			while (hasBeendone == 0){
				if (barber == 0){
					acquire(b1.button);
					hasBeendone = 1;
					System.out.println("Customer" + id + " blir klippt av Barber1");
					b1.cut.release();
					acquire(b1.done);
					System.out.println("Customer" + id + " er done med Barber1");
				}
				else if (barber == 1){
					acquire(b2.button);
					hasBeendone = 1;
					System.out.println("Customer" + id + " blir klippt av Barber2");
					b2.cut.release();
					acquire(b2.done);
					System.out.println("Customer" + id + " er done med Barber2");
				}
				else if (barber == 2){
					acquire(b3.button);
					hasBeendone = 1;
					System.out.println("Customer" + id + " blir klippt av Barber3");
					b3.cut.release();
					acquire(b3.done);
					System.out.println("Customer" + id + " er done med Barber3");
				}
			}
		}
	}

	public class Barber implements Runnable {
		Semaphore button = new Semaphore(1, true);
		Semaphore done = new Semaphore(0, true);
		Semaphore cut = new Semaphore(0, true);
		int id;

		public Barber(int id){
			this.id = id;
		}
		
		public void acquire(Semaphore a){
			try {
				a.acquire();
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		
		public void run() {

			
			while(true){
				System.out.println("Barber" + id + " is sleeping");
				Random rand = new Random();
				
				acquire(cut);
				int chair = (int) Math.random()*100;
				System.out.println(chair);
				if (chair == 0){
					acquire(chair1);
					System.out.println("Barber" + id + " tar stol " + (chair+1));
				}
				else {
					acquire(chair2);
					System.out.println("Barber" + id + " tar stol " + (chair+1));
				}
				System.out.println("Barber" + id + " is cutting");
				try {
					Thread.sleep(3000 + (int) Math.random()*1000);
				} catch (InterruptedException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
				if (chair == 0){
					chair1.release();
				}
				else {
					chair2.release();
				}
				done.release();
				button.release();
			}			
		}
	}
}
