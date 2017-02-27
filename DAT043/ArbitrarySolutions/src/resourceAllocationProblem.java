import java.util.Queue;
import java.util.concurrent.locks.*;


public class resourceAllocationProblem<E> {

	private final Lock lock = new ReentrantLock();
	private final Condition moreResources = lock.newCondition();
	private int units = 0;
	private Queue<E> store ; 

	public E allocate() throws InterruptedException { 
		E element; 
		
		lock.lock();
		while (units == 0) moreResources.await();
		units--;
		element = store.remove();
		lock.unlock();
		
		return element;
	}

	public void release(E elem) {
		lock.lock();
		store.add(elem);
		units++;
		lock.unlock();
	}
}
