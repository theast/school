import java.util.concurrent.locks.*;

public class readerWriterProblem {
	private int readers = 0;
	private int writers = 0;
	private final Lock lock = new ReentrantLock();
    private final Condition okToRead   = lock.newCondition();
    private final Condition okToWrite  = lock.newCondition();
	
	public readerWriterProblem (){}
	
	public void read (){
		lock.unlock();
		while (writers > 0) try { okToRead.await(); } catch(InterruptedException e) {};
		readers++;
		//Do some junk..
		readers--;
		if (readers == 0) okToWrite.signal();
		lock.unlock();
	}
	
	public void write (){
		lock.lock();
		while (readers > 0 || writers > 0) try { okToWrite.await(); } catch (InterruptedException e) {} ;
		writers++;
		// do some junk
		writers--;
		okToRead.signalAll();
		okToWrite.signal();
		lock.unlock();
	}
}
