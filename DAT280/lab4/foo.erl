-module(foo).
-compile(export_all).
foo() -> io:format(user, "hello", []).
cnl() ->
    net_adm:ping(theo@localhost),
    net_adm:ping(affe@localhost),
    net_adm:ping(hagge@localhost),
        c:c(crawl),
        c:c(map_reduce),
        c:c(page_rank),
        c:nl(crawl),
        c:nl(map_reduce),
        c:nl(page_rank),
        nodes().
time_taken_to_execute(F) -> 
    Start = os:timestamp(),
    F(),
    io:format("total time taken ~f seconds~n", [timer:now_diff(os:timestamp(), Start) / 1000000]).
