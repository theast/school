import java.util.concurrent.Semaphore;

public class tobacco {
	Semaphore[] smokers = new Semaphore[3];
	Semaphore table = new Semaphore(1, true);
	Thread[] smokerThreads = new Thread[3];
	Thread tableThread = new Thread(new table());

	public static void main(String[] args) {
		new tobacco();
	}

	public tobacco(){
		
		tableThread.start();
		
		for (int i = 0; i < 3; i++){
			smokers[i] = new Semaphore(0, true);
			smokerThreads[i] = new Thread(new smoker(i));
			smokerThreads[i].start();
		}
	}

	public class smoker implements Runnable {
		int id;

		public smoker (int id){
			this.id = id;
		}

		public void run() {
			while(true){
				try {smokers[id].acquire();}
				catch(InterruptedException E){};

				System.out.println("Smoker" + id + " is smoking");
				try {Thread.sleep(1000);}
				catch(InterruptedException E){};

				table.release();
			}
		}
	}

	public class table implements Runnable {
		public void run() {
			while(true){
				try{table.acquire();}
				catch(InterruptedException e) {};

				int random = (int)(Math.random()*3);
				System.out.println("Chosing smoker number: " + random);
				smokers[random].release();
			}
		}
	}
}
