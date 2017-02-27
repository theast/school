import java.util.Iterator;

/**
A <i>path</i> is a sequence of nodes describing how to get from one node to
another in a graph.
A node is represented by its name (a {@link String}).
A node can not occur more than once in a single path.
The path is initialized by a call to <tt>computePath()</tt> after which the
relevant information can be retrieved using the methods <tt>getPath()</tt> and
<tt>getPathLength()</tt>.

<p>
<b>
All implementations of a Path must support two constructors both taking two
arguments; one takes the name of a stop file and the name of a line file, and
the other takes two lists with the stops and lines (i.e List&lt;BStop&gt; and
List&lt;BLineTable&gt;).</b>

<p>
A class implementing <tt>Path</tt> could be used as follows:

<pre>
  Lab3File lab3file = new Lab3File();
  List stops = lab3file.readStops("stops-gbg.txt");
  List lines = lab3file.readLines("lines-gbg.txt");
  Path p = new MyPath(stops, lines);
  p.computePath("Chalmers","Angered");
  System.out.println("Distance: " + p.getPathLength());
  p.computePath("Chalmers","GuldHeden");
  System.out.println("Distance: " + p.getPathLength());
</pre>
*/
public interface Path {

    /**
    Computes the path from <tt>from</tt> to <tt>to</tt>.
    Path information can be retrieved by subsequent calls to <tt>getPath()</tt>
    and <tt>getPathLength()</tt>.
    Must be possible to call this method any number of times.
    */
    public void computePath(String from, String to);
    
    /**
    Return an iterator over (the names of) the nodes in the path.
    <p>
    If a path has been found the first node in the iterator is the argument
    <tt>from</tt> passed to <tt>computePath</tt> and the last node is
    <tt>to</tt>.
    <p>
    If no path was found or if no call to computePath has been made the
    iterator is empty.
    
    @return An iterator over the computed path.
    */
    public Iterator<String> getPath();
    
    /**
    Returns the length of the computed path, that is, the sum of the weights of
    each arc on the path.
    <p>
    If no path was found the return value is an arbitrary integer. It is
    appropriate but not required to return a special value such as -1 in this
    case.

    @return The length of the computed path.
    */
    public int getPathLength();
}

