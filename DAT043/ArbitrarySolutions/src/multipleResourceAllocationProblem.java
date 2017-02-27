import java.util.Queue;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;


public class multipleResourceAllocationProblem<E> {

	private final Lock lock = new ReentrantLock();
	private final Condition moreResources = lock.newCondition();
	private int units = 0;
	private Queue<E> store ; 

	public Set<E> allocate(int n) throws InterruptedException { 
		Set<E> el = new TreeSet<E>();	
		lock.lock();
		while (units-n > 0) moreResources.await();
		units -= n;
		
		for (int i = 0; i < n; i++){
			el.add(store.remove());
		}

		lock.unlock();
		return el;
	}

	public void release(TreeSet<E> elems) {
		
		lock.lock();
		units += elems.size();
		store.addAll(elems);
		moreResources.signal();
		lock.unlock();
		
	}

}
