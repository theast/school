function [mu, sigma] = sgeass22(x)
[n, p] = size(x);

mu = zeros(p,1);

for i=1:p
    mu(i) = sum(x(:,i))/n;
end

sigma = 0;
for i=1:n
    sub = x(i,:)' - mu;
   sigma = sigma + transpose(sub)*sub; 
end

sigma = sigma * 1/(n*p);
end