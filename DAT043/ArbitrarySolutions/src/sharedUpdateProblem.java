import java.util.concurrent.*;

public class sharedUpdateProblem {
	private int people = 50;
	private int counter;
	Semaphore increment = new Semaphore(1, true);
	Thread west, east;
	
	public static void main(String[] args){
		new sharedUpdateProblem();
	}
	
	public sharedUpdateProblem(){
		west = new Thread(new Gate(people, "West"));
		east = new Thread(new Gate(people, "East"));
		west.start();
		east.start();
	}
	
	public class Gate implements Runnable {
		int people;
		String nameOfGate;
		
		public Gate(int people, String nameOfGate){
			this.people = people;
			this.nameOfGate = nameOfGate;
		}

		public void run() {
			for (int i = 0; i < people; i++){
				try {
					increment.acquire();
				} catch (InterruptedException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
				System.out.println("Person" + i + " entering " + nameOfGate);
				counter++;
				increment.release();	
				try {
					Thread.sleep(10 + (int)(Math.random()*1000));
				} catch (InterruptedException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
	}
}
