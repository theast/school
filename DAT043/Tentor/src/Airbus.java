import java.util.concurrent.Semaphore;


public class Airbus {
	private int noPassengers = 850;
	private Semaphore[] doors = new Semaphore[16];
	private Thread[] persons = new Thread[noPassengers];

	public static void main(String[] args){
		new Airbus();
	}

	public Airbus(){

		for (int i = 0; i < 16; i++){
			doors[i] = new Semaphore(2, true);
		}

		for (int i = 0; i < noPassengers; i++){
			persons[i] = new Thread(new Person(i));
			persons[i].start();
		}
	}

	public class Person implements Runnable {
		int id;
		
		public Person(int id){
			this.id = id;
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
			int exitNo = (id * 16) / 850;
			
			tryAcquire(doors[exitNo]);
			System.out.println("Passenger" + id + " leaving..");
			try {
				Thread.sleep(200);
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			doors[exitNo].release();
		}
	}
}
