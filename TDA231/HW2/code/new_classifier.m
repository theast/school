function [ Ytest ] = new_classifier(Xtest, mu1, mu2)

sub = mu1-mu2;
sum = 0;
for i=1:size(Xtest)
    sum = sum + sub(i)^2;
end

Ytest = sign(((sub)'*(Xtest'-0.5*(mu1+mu2)))/(sqrt(sum)));

end

