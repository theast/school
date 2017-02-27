import java.util.concurrent.Semaphore;

public class sushi {
	private Thread consumer1;
	private Thread consumer2;
	private Thread sushimaster;
	private int[] buffer;
	private Semaphore empty, full, mutexPut, mutexTake;
	private int front, rear, capacity;


	public static void main(String[] args){
		new sushi(9);
	}

	public sushi(int capacity){
		this.capacity = capacity;
		buffer = new int[capacity];
		front = 0;
		rear = 0;
		empty = new Semaphore(capacity, true);
		full = new Semaphore(0, true);
		mutexPut = new Semaphore(1, true);
		mutexTake = new Semaphore(1, true);

		consumer1 = new Thread(new Consumer(1));
		consumer2 = new Thread(new Consumer(2));
		
		sushimaster = new Thread(new sushimaker());
		sushimaster.start();
		consumer1.start();
		consumer2.start();
	}

	public void tryAcquire(Semaphore mutex){
		try{
			mutex.acquire();
		} catch(InterruptedException e){
			e.printStackTrace();    // or only e.getMessage() for the error
			System.exit(1);
		}
	}

	public class Consumer implements Runnable {
		int id;
		public Consumer(int id){
			this.id = id;
		}
		public void run() {
			while(true){
				tryAcquire(full);
				tryAcquire(mutexTake);
				System.out.println("Consumer " + id + " Eating sushi");
				int result = buffer[rear];
				rear = (rear+1) % capacity;
				mutexTake.release();
				empty.release();
				
				int random = (int) Math.ceil(Math.random()*10000);
				try {
					Thread.sleep(1000 + random);
				} catch (InterruptedException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			
		
			}
		}
	}

	public class sushimaker implements Runnable {
		public sushimaker(){
		}
		public void run(){

			for (int i = 0; i < 100; i++){
				try {
					Thread.sleep(200);
				} catch (InterruptedException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
				System.out.println("Making some sushi");
				tryAcquire(empty);
				tryAcquire(mutexPut);
				buffer[front] = (int) Math.random()*1000;
				front = (front+1) % capacity;
				mutexPut.release();
				full.release();	
			}
		}
	}
}
