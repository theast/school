alpha = 10;
beta = 1;

gamma = @(y) integral(@(t) t.^(y-1).*exp(-t), 0, Inf); 
posteriorln = @(s) alpha.*log(beta)-(length(x)+alpha+1).*log(s)-length(x).*log(2.*pi)+log(gamma(alpha))-(beta./s)-(1./(2.*s)).*xsum(x);

[X, Y] = fplot(posteriorln, [0 2]);

% Scale the posterior to 1
[A, B] = fplot(@(s) exp(posteriorln(s)-max(Y)), [0 2]);
hold on;
fplot(@(s) exp(posteriorln(s)-max(Y))/max(B), [0 2]);


% Scale prior to 1
prior = @(s) beta.^(alpha)./gamma(alpha).*s.^(-alpha-1).*exp(-beta/s);
[A, B] = fplot(prior, [0 2]);
fplot(@(s) prior(s)/max(B), [0 2]);

hold off;




