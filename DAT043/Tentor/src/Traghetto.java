import java.util.concurrent.Semaphore;

public class Traghetto {

	private Thread boat;
	private Thread person1;
	private Thread person2;
	private Thread person3;
	private Person p1;
	private Person p2;
	private Person p3;
	private Boat b1;


	public static void main(String[] args){
		new Traghetto();
	}

	public Traghetto(){
		b1 = new Boat();
		boat = new Thread(b1);

		p1 = new Person();
		p2 = new Person();
		p3 = new Person();
		person1 = new Thread(p1);
		person2 = new Thread(p2);
		person3 = new Thread(p3);

		boat.start();
		person1.start();
		person2.start();
		person3.start();
	}

	public class Person implements Runnable {
		private Semaphore person;

		public Person() {
			person = new Semaphore(0, true);
		}

		public void run() {
			while(true){
				System.out.println("Waiting for boat");
				b1.tryAcquire(b1.going);
				person.release();
			}
		}
	}

	public class Boat implements Runnable {
		public Semaphore going;

		public Boat(){
			going = new Semaphore(0, true);
		}

		public void tryAcquire(Semaphore mutex){
			try{
				mutex.acquire();
			} catch(InterruptedException e){
				e.printStackTrace();    // or only e.getMessage() for the error
				System.exit(1);
			}
		}

		public void run() {
			int a = 0;
			while(a < 3){
				System.out.println("At: San Marcoulaen");
				System.out.println("Leaving: San Marcoulaen");
				try {
					Thread.sleep(1000);
				} catch (InterruptedException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}

				System.out.println("Arrived: Fondaco dei Turchi");
				for (int i = 0; i <3; i++)
				going.release();

				tryAcquire(p1.person);
				System.out.println("Person1 acquired");
				tryAcquire(p2.person);
				System.out.println("Person2 acquired");
				tryAcquire(p3.person);
				System.out.println("Person3 acquired");

				System.out.println("Leaving: Fondaco dei Turchi");
				try {
					Thread.sleep(1000);
				} catch (InterruptedException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}

				System.out.println("Arrived: San Marcoulaen");
				for (int i = 0; i <3; i++)
					going.release();
				
				tryAcquire(p1.person);
				System.out.println("Person1 acquired");
				tryAcquire(p2.person);
				System.out.println("Person2 acquired");
				tryAcquire(p3.person);
				System.out.println("Person3 acquired");

				a++;
				System.out.println("Done with this round");
				System.out.println("");
			}
		}
	}
}
